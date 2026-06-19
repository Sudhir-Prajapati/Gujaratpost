const SettingModel = require('../models/settingModel');

// @desc    Get aggregated dynamic market rates and currencies
// @route   GET /api/markets/live-rates
// @access  Public
const fetchLiveRates = async (req, res) => {
  try {
    const settings = await SettingModel.getAll();

    // 1. Fetch Currency Rates (from ExchangeRate-API)
    let usdInr = Number(settings.usd_val || '83.45');
    let eurInr = Number(settings.eur_val || '89.60');
    let gbpInr = Number(settings.gbp_val || '105.80');
    
    const exchApiKey = settings.exchangerate_api_key;
    if (exchApiKey && exchApiKey !== 'YOUR_ACCESS_KEY' && exchApiKey !== 'YOUR_KEY') {
      try {
        const exchUrl = `https://v6.exchangerate-api.com/v6/${exchApiKey}/latest/INR`;
        const exchRes = await fetch(exchUrl);
        const exchData = await exchRes.json();
        if (exchData.result === 'success' && exchData.conversion_rates) {
          const rates = exchData.conversion_rates;
          if (rates.USD) usdInr = Number((1 / rates.USD).toFixed(2));
          if (rates.EUR) eurInr = Number((1 / rates.EUR).toFixed(2));
          if (rates.GBP) gbpInr = Number((1 / rates.GBP).toFixed(2));
        }
      } catch (err) {
        console.error('Error fetching ExchangeRate-API:', err.message);
      }
    }

    // 2. Fetch Commodity Rates (Gold / Silver from Metals-API)
    let goldVal = settings.gold_val || '72,450';
    let silverVal = settings.silver_val || '87,400';
    
    const metalsApiKey = settings.metals_api_key;
    if (metalsApiKey && metalsApiKey !== 'YOUR_ACCESS_KEY') {
      try {
        const metalsUrl = `https://metals-api.com/api/latest?access_key=${metalsApiKey}&base=INR&symbols=XAU,XAG`;
        const metalsRes = await fetch(metalsUrl);
        const metalsData = await metalsRes.json();
        if (metalsData.success && metalsData.rates) {
          const rates = metalsData.rates;
          const xauInr = rates.XAU; 
          const xagInr = rates.XAG; 
          
          if (xauInr) {
            const gold10g = (xauInr / 31.1034768) * 10;
            goldVal = Math.round(gold10g).toLocaleString('en-IN');
          }
          if (xagInr) {
            const silver1kg = (xagInr / 31.1034768) * 1000;
            silverVal = Math.round(silver1kg).toLocaleString('en-IN');
          }
        }
      } catch (err) {
        console.error('Error fetching Metals-API:', err.message);
      }
    }

    // 3. Fetch Bitcoin / Crypto (from CoinGecko)
    let btcUsd = '65,420';
    const geckoApiKey = settings.coingecko_api_key || 'CG-NeqobDSamn6JdF38eVSULW3y';
    if (geckoApiKey) {
      try {
        const geckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&x_cg_demo_api_key=${geckoApiKey}`;
        const geckoRes = await fetch(geckoUrl);
        const geckoData = await geckoRes.json();
        if (geckoData.bitcoin && geckoData.bitcoin.usd) {
          btcUsd = Math.round(geckoData.bitcoin.usd).toLocaleString('en-US');
        }
      } catch (err) {
        console.error('Error fetching CoinGecko:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        MARKETS: [
          { name: 'SENSEX', val: settings.sensex_val || '76,721.08', change: settings.sensex_change || '+852.34 (1.07%)', dir: settings.sensex_dir || 'up' },
          { name: 'NIFTY', val: settings.nifty_val || '24,619.85', change: settings.nifty_change || '+252.15 (1.04%)', dir: settings.nifty_dir || 'up' },
          { name: 'GOLD (24K)', val: goldVal, change: settings.gold_change || '-220.00 (0.30%)', dir: settings.gold_dir || 'down' }
        ],
        COMMODITY: [
          { name: 'SILVER (1KG)', val: silverVal, change: settings.silver_change || '+450.00 (0.52%)', dir: settings.silver_dir || 'up' },
          { name: 'CRUDE OIL', val: settings.crude_val || '6,850', change: settings.crude_change || '-45.00 (0.65%)', dir: settings.crude_dir || 'down' },
          { name: 'COPPER', val: settings.copper_val || '785', change: settings.copper_change || '+4.20 (0.54%)', dir: settings.copper_dir || 'up' }
        ],
        CURRENCY: [
          { name: 'USD / INR', val: usdInr.toString(), change: settings.usd_change || '-0.08 (0.10%)', dir: settings.usd_dir || 'down' },
          { name: 'EUR / INR', val: eurInr.toString(), change: settings.eur_change || '+0.12 (0.13%)', dir: settings.eur_dir || 'up' },
          { name: 'GBP / INR', val: gbpInr.toString(), change: settings.gbp_change || '+0.35 (0.33%)', dir: settings.gbp_dir || 'up' }
        ],
        CRYPTO: [
          { name: 'BTC / USD', val: btcUsd, change: '+1.20%', dir: 'up' }
        ],
        whatsapp_followers: settings.whatsapp_followers || '125K +',
        homepage_title: settings.homepage_title || 'Gujarat',
        homepage_subtitle: settings.homepage_subtitle || 'news hub',
        homepage_tagline: settings.homepage_tagline || 'Fast • Trusted • First',
        youtube_channel_url: settings.youtube_channel_url || 'https://www.youtube.com/@GujaratPost',
        trending_label_en: settings.trending_label_en || 'Trending',
        trending_label_gu: settings.trending_label_gu || 'ટ્રેન્ડિંગ',
        featured_id_1: settings.featured_id_1 || null,
        featured_id_2: settings.featured_id_2 || null,
        featured_id_3: settings.featured_id_3 || null,
        featured_id_4: settings.featured_id_4 || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to aggregate live market rates.',
      error: error.message
    });
  }
};

// @desc    Get raw settings key-value map
// @route   GET /api/markets/settings
// @access  Protected (Admin/Editor)
const getSettings = async (req, res) => {
  try {
    const settings = await SettingModel.getAll();
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings.',
      error: error.message
    });
  }
};

// @desc    Update settings key-values
// @route   POST /api/markets/settings
// @access  Protected (Admin/Editor)
const updateSettings = async (req, res) => {
  try {
    const data = req.body; // Key-value object
    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Request body must be a valid key-value object.'
      });
    }

    for (const key of Object.keys(data)) {
      await SettingModel.set(key, data[key]);
    }

    const updated = await SettingModel.getAll();
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully.',
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update settings.',
      error: error.message
    });
  }
};

module.exports = {
  fetchLiveRates,
  getSettings,
  updateSettings
};
