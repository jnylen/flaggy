async function loadGeoData() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    if (!tab) {
      showError('No active tab found');
      return;
    }

    const response = await browser.runtime.sendMessage({
      action: 'getGeoData',
      tabId: tab.id
    });

    if (response) {
      displayGeoData(response);
    } else {
      showError('No data available for this tab');
    }
  } catch (error) {
    showError('Error loading data: ' + error.message);
  }
}

function displayGeoData(data) {
  const countryCode = data.country_code?.toLowerCase();
  const flagSrc = countryCode ? `flags/${countryCode}.png` : 'icons/icon-48.png';

  document.getElementById('flag').src = flagSrc;
  document.getElementById('flag').alt = data.country || 'Unknown';
  document.getElementById('country').textContent = data.country || 'Unknown';
  document.getElementById('ip').textContent = data.ip || 'Unknown';
  document.getElementById('country-detail').textContent = data.country || 'Unknown';
  document.getElementById('city').textContent = data.city || 'Unknown';
  document.getElementById('isp').textContent = data.isp || 'Unknown';
  document.getElementById('org').textContent = data.organization || 'Unknown';
  document.getElementById('asn').textContent = data.asn || 'Unknown';
  document.getElementById('timezone').textContent = data.timezone || 'Unknown';

  document.getElementById('header').style.display = 'flex';
  document.querySelector('.info').style.display = 'flex';
  document.getElementById('error').style.display = 'none';
}

function showError(message) {
  document.getElementById('header').style.display = 'none';
  document.querySelector('.info').style.display = 'none';
  document.getElementById('error').textContent = message;
  document.getElementById('error').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', loadGeoData);
