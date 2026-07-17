const geoCache = new Map();

async function getGeoData(tabId, hostname) {
  if (geoCache.has(tabId)) {
    return geoCache.get(tabId);
  }

  try {
    const dnsResult = await browser.dns.resolve(hostname);
    if (!dnsResult || !dnsResult.addresses || dnsResult.addresses.length === 0) {
      return null;
    }

    const ip = dnsResult.addresses[0];
    const response = await fetch(geoipUrl(ip));
    if (!response.ok) {
      throw new Error('API request failed');
    }
    const data = await response.json();
    const geoInfo = mapGeoResponse(data, ip);

    geoCache.set(tabId, geoInfo);
    return geoInfo;
  } catch (error) {
    console.error('Error fetching geo data:', error);
    return null;
  }
}

async function updateTab(tabId, url) {
  if (!url || url.startsWith('about:') || url.startsWith('moz-extension:')) {
    return;
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    if (!hostname) {
      return;
    }

    const geoInfo = await getGeoData(tabId, hostname);
    if (geoInfo) {
      const countryCode = geoInfo.country_code?.toLowerCase();
      const iconPath = countryCode ? `flags/${countryCode}.png` : 'icons/icon-48.png';

      await browser.browserAction.setIcon({
        tabId: tabId,
        path: {
          '48': iconPath
        }
      });

      await browser.browserAction.setTitle({
        tabId: tabId,
        title: `${geoInfo.country} (${geoInfo.ip})`
      });
    } else {
      await browser.browserAction.setIcon({
        tabId: tabId,
        path: {
          '48': 'icons/icon-48.png'
        }
      });

      await browser.browserAction.setTitle({
        tabId: tabId,
        title: 'Flaggy - Unknown'
      });
    }
  } catch (error) {
    console.error('Error updating tab:', error);
  }
}

async function handleTabUpdated(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    geoCache.delete(tabId);
    await updateTab(tabId, tab.url);
  }
}

async function handleTabActivated(activeInfo) {
  try {
    const tab = await browser.tabs.get(activeInfo.tabId);
    await updateTab(activeInfo.tabId, tab.url);
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
}

browser.tabs.onUpdated.addListener(handleTabUpdated);
browser.tabs.onActivated.addListener(handleTabActivated);

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getGeoData') {
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      const tab = tabs[0];
      if (tab && geoCache.has(tab.id)) {
        sendResponse(geoCache.get(tab.id));
      } else if (tab) {
        const urlObj = new URL(tab.url);
        const hostname = urlObj.hostname;
        if (hostname) {
          getGeoData(tab.id, hostname).then(data => {
            sendResponse(data);
          });
        } else {
          sendResponse(null);
        }
      } else {
        sendResponse(null);
      }
    });
    return true;
  }
});
