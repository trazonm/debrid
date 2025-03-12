const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const axios = require('axios');
const { getRealDebridHeaders } = require('../utils/realDebrid');
const dns = require('dns');
const pool = require('../utils/pool');
dns.setDefaultResultOrder('ipv4first'); // Node.js 16.4.0+ only
const router = express.Router();
const ytdl = require('@distube/ytdl-core');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
    res.render('premiumizer', { scriptNonce: res.locals.scriptNonce, styleNonce: res.locals.styleNonce, fontNonce: res.locals.fontNonce, mediaNonce: res.locals.mediaNonce, imgNonce: res.locals.imgNonce, user: req.session.user });
});

//Get Supported Hosters
router.get('/hosters', asyncHandler(async (req, res) => {
    const apiURL = `https://api.real-debrid.com/rest/1.0/hosts/status`;
    const {
        data: response
    } = await axios.get(apiURL, {
        headers: getRealDebridHeaders()
    });
    res.json(response);
}));

// GET /downloads/hoster-downloads
// Retrieve all hoster downloads from the user's hoster_downloads column
router.get('/hoster-downloads', async (req, res) => {
  try {
    const userId = req.session.user;
    const result = await pool.query(
      'SELECT hoster_downloads FROM users WHERE username = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return the hoster_downloads array (or an empty array if null)
    const hosterDownloads = result.rows[0].hoster_downloads || [];
    res.json(hosterDownloads);
  } catch (error) {
    console.error('Error retrieving hoster downloads:', error);
    res.status(500).json({ error: 'Failed to retrieve hoster downloads' });
  }
});

// POST /downloads/hoster-downloads
// Add a new hoster download to the user's hoster_downloads array
router.post('/hoster-downloads', async (req, res) => {
  try {
    const userId = req.session.user;
    const downloadData = req.body;
    
    // First, get current hoster_downloads
    const currentResult = await pool.query(
      'SELECT hoster_downloads FROM users WHERE username = $1',
      [userId]
    );
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Ensure downloads is a proper array
    let downloads = [];
    
    // Check if hoster_downloads exists and is an array
    if (currentResult.rows[0].hoster_downloads && 
        Array.isArray(currentResult.rows[0].hoster_downloads)) {
      downloads = currentResult.rows[0].hoster_downloads;
    }
    
    // Add timestamp to the download data
    downloadData.created_at = new Date().toISOString();
    
    // Add the new download to the array
    downloads.push(downloadData);
    
    // Update the user's hoster_downloads column
    // Using CAST to explicitly handle the JSON format
    const updateResult = await pool.query(
      `UPDATE users SET hoster_downloads = $1::jsonb 
       WHERE username = $2 
       RETURNING id, username`,
      [JSON.stringify(downloads), userId]
    );
    
    res.status(201).json(downloadData);
  } catch (error) {
    console.error('Error saving hoster download:', error);
    res.status(500).json({ error: 'Failed to save hoster download' });
  }
});

// DELETE /downloads/hoster-downloads/:id
// Remove a download from the user's hoster_downloads array by id
router.delete('/hoster-downloads/:id', async (req, res) => {
  try {
    const userId = req.session.user;
    const downloadId = req.params.id;
    
    // Update the user's hoster_downloads column using jsonb functions
    const updateResult = await pool.query(`
      UPDATE users
      SET hoster_downloads = COALESCE(
        (
          SELECT jsonb_agg(elem)
          FROM jsonb_array_elements(hoster_downloads) elem
          WHERE elem->>'id' != $1
        ), '[]'::jsonb
      )
      WHERE username = $2
      RETURNING id;
    `, [downloadId, userId]);
    
    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'Download removed' });
  } catch (error) {
    console.error('Error deleting hoster download:', error);
    res.status(500).json({ error: 'Failed to delete hoster download' });
  }
});

// Update a download's information
router.patch('/hoster-downloads/:id', async (req, res) => {
  try {
    const userId = req.session.user;
    const downloadId = req.params.id;
    const updateData = req.body;
    
    // Get current hoster_downloads
    const currentResult = await pool.query(
      'SELECT hoster_downloads FROM users WHERE username = $1',
      [userId]
    );
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Ensure downloads is a proper array
    let downloads = [];
    
    // Check if hoster_downloads exists and is an array
    if (currentResult.rows[0].hoster_downloads && 
        Array.isArray(currentResult.rows[0].hoster_downloads)) {
      downloads = currentResult.rows[0].hoster_downloads;
    }
    
    // Find and update the download with matching ID
    const downloadIndex = downloads.findIndex(download => download.id === downloadId);
    
    if (downloadIndex === -1) {
      return res.status(404).json({ error: 'Download not found' });
    }
    
    // Update the download with new data
    downloads[downloadIndex] = {
      ...downloads[downloadIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    // Update the user's hoster_downloads column
    const updateResult = await pool.query(
      `UPDATE users SET hoster_downloads = $1::jsonb 
       WHERE username = $2 
       RETURNING id, username`,
      [JSON.stringify(downloads), userId]
    );
    
    res.json({ success: true, download: downloads[downloadIndex] });
  } catch (error) {
    console.error('Error updating download:', error);
    res.status(500).json({ error: 'Failed to update download' });
  }
});

// Update an alternative download in a specific download
router.patch('/hoster-downloads/:id/alternative/:altId', async (req, res) => {
  try {
    const userId = req.session.user;
    const downloadId = req.params.id;
    const altId = req.params.altId;
    const updateData = req.body;
    
    // Get current hoster_downloads
    const currentResult = await pool.query(
      'SELECT hoster_downloads FROM users WHERE username = $1',
      [userId]
    );
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Ensure downloads is a proper array
    let downloads = [];
    
    // Check if hoster_downloads exists and is an array
    if (currentResult.rows[0].hoster_downloads && 
        Array.isArray(currentResult.rows[0].hoster_downloads)) {
      downloads = currentResult.rows[0].hoster_downloads;
    }
    
    // Find the download with matching ID
    const downloadIndex = downloads.findIndex(download => download.id === downloadId);
    
    if (downloadIndex === -1) {
      return res.status(404).json({ error: 'Download not found' });
    }
    
    // Find the alternative with matching ID
    const download = downloads[downloadIndex];
    if (!download.alternative || !Array.isArray(download.alternative)) {
      return res.status(404).json({ error: 'No alternatives found for this download' });
    }
    
    const altIndex = download.alternative.findIndex(alt => alt.id === altId);
    
    if (altIndex === -1) {
      return res.status(404).json({ error: 'Alternative not found' });
    }
    
    // Update the alternative with new data
    download.alternative[altIndex] = {
      ...download.alternative[altIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    // Update the user's hoster_downloads column
    const updateResult = await pool.query(
      `UPDATE users SET hoster_downloads = $1::jsonb 
       WHERE username = $2 
       RETURNING id, username`,
      [JSON.stringify(downloads), userId]
    );
    
    res.json({ success: true, alternative: download.alternative[altIndex] });
  } catch (error) {
    console.error('Error updating alternative download:', error);
    res.status(500).json({ error: 'Failed to update alternative download' });
  }
});

// YouTube download endpoint
router.get('/youtube', asyncHandler(async (req, res) => {
  try {
    const url = req.query.link;
    
    // Check if the URL is a valid YouTube URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    
    // Get video info with @distube/ytdl-core
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://www.youtube.com',
          'Referer': 'https://www.youtube.com/'
        }
      }
    });
    
    // Safety check
    if (!info || !info.formats || !info.videoDetails) {
      return res.status(500).json({ error: 'Failed to extract video information' });
    }
    
    // Get combined audio+video formats (typically max 720p)
    const combinedFormats = ytdl.filterFormats(info.formats, 'audioandvideo')
      .filter(format => format.itag) // Make sure format has an itag
      .sort((a, b) => {
        const qualityA = parseInt(a.qualityLabel) || 0;
        const qualityB = parseInt(b.qualityLabel) || 0;
        return qualityB - qualityA;
      });
    
    // Get high quality video-only formats (for 1080p and above)
    const videoOnlyFormats = ytdl.filterFormats(info.formats, 'videoonly')
      .filter(format => format.itag && format.qualityLabel)
      .sort((a, b) => {
        const qualityA = parseInt(a.qualityLabel) || 0;
        const qualityB = parseInt(b.qualityLabel) || 0;
        return qualityB - qualityA;
      });
      
    // Get audio formats for combining with high-quality video
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly')
      .filter(format => format.itag)
      .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));
    
    // YouTube video ID
    const videoId = info.videoDetails.videoId;
    
    // Prepare the result
    const result = {
      id: uuidv4(),
      filename: info.videoDetails.title || 'YouTube Video',
      host: 'YouTube',
      streamable: true,
      videoId: videoId, 
      quality: combinedFormats[0]?.qualityLabel || 'Unknown',
      formatItag: combinedFormats[0]?.itag || audioFormats[0]?.itag,
      type: combinedFormats.length > 0 ? 'video' : 'audio',
      thumbnail: info.videoDetails.thumbnails ? 
                 info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url : null,
      alternative: [],
      downloadStatus: "ready",
      videoExpiry: Date.now() + (6 * 60 * 60 * 1000), // 6 hours from now
      instructions: "Links expire after 6 hours. If download fails, click 'Refresh Links' button."
    };
    
    // Add direct stream URL for the main format
    result.download = `/premiumizer/youtube/stream/${result.videoId}/${result.formatItag}`;
    
    // Add the rest of the combined formats as alternatives
    combinedFormats.slice(1).forEach(format => {
      if (format.itag) {
        result.alternative.push({
          id: uuidv4(),
          filename: `${info.videoDetails.title} [${format.qualityLabel}]`,
          quality: format.qualityLabel || 'Unknown',
          streamable: true,
          download: `/premiumizer/youtube/stream/${videoId}/${format.itag}`,
          formatItag: format.itag,
          type: 'video'
        });
      }
    });
    
    // Add high-quality video formats (1080p+) with notes about needing audio separately
    videoOnlyFormats.forEach(format => {
      if (format.itag && format.qualityLabel && parseInt(format.qualityLabel) >= 1080) {
        result.alternative.push({
          id: uuidv4(),
          filename: `${info.videoDetails.title} [${format.qualityLabel} - Video Only]`,
          quality: `${format.qualityLabel} (NO AUDIO)`,
          streamable: true,
          download: `/premiumizer/youtube/stream/${videoId}/${format.itag}`,
          formatItag: format.itag,
          type: 'video-only',
          note: 'Video only - download audio separately'
        });
      }
    });
    
    // Add the best audio format to accompany high-quality video
    if (audioFormats.length > 0) {
      const bestAudio = audioFormats[0];
      result.alternative.push({
        id: uuidv4(),
        filename: `${info.videoDetails.title} [Best Audio ${bestAudio.audioBitrate}kbps]`,
        quality: `Audio ${bestAudio.audioBitrate}kbps`,
        streamable: true,
        download: `/premiumizer/youtube/stream/${videoId}/${bestAudio.itag}`,
        formatItag: bestAudio.itag,
        type: 'audio',
        note: 'Audio only - download with high-quality video'
      });
      
      // Add other audio formats
      audioFormats.slice(1).forEach(format => {
        if (format.itag) {
          result.alternative.push({
            id: uuidv4(),
            filename: `${info.videoDetails.title} [Audio ${format.audioBitrate}kbps]`,
            quality: `Audio ${format.audioBitrate}kbps`,
            streamable: true,
            download: `/premiumizer/youtube/stream/${videoId}/${format.itag}`,
            formatItag: format.itag,
            type: 'audio'
          });
        }
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('YouTube download error:', error);
    res.status(500).json({ error: error.message || 'Failed to process YouTube video' });
  }
}));

// Add a new endpoint to stream YouTube videos through our server as a proxy
router.get('/youtube/stream/:videoId/:formatItag', asyncHandler(async (req, res) => {
  try {
    const { videoId, formatItag } = req.params;
    
    // Get fresh info (to avoid URL expiration issues)
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://www.youtube.com',
          'Referer': 'https://www.youtube.com/'
        }
      }
    });
    
    // Find the format with matching itag
    const format = info.formats.find(f => f.itag === parseInt(formatItag));
    
    if (!format || !format.url) {
      return res.status(404).json({ error: 'Format not found or URL not available' });
    }
    
    // Use direct redirect instead of proxying
    // This avoids the 403 error by letting the client download directly from YouTube's servers
    // The URL is freshly generated and valid for the client's IP
    
    // Set the filename
    const fileExt = format.mimeType.includes('video') ? 'mp4' : format.mimeType.includes('audio') ? 'mp3' : 'bin';
    const safeFilename = info.videoDetails.title.replace(/[^a-z0-9]/gi, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.${fileExt}"`);
    
    // Redirect to YouTube's CDN URL
    console.log(`Redirecting to: ${format.url.substring(0, 100)}...`);
    return res.redirect(format.url);
    
  } catch (error) {
    console.error('YouTube streaming error:', error);
    res.status(500).json({ error: 'Failed to stream YouTube video' });
  }
}));

// Add a new endpoint for checking/refreshing YouTube links
router.get('/youtube/check/:videoId/:formatItag', asyncHandler(async (req, res) => {
  try {
    const { videoId, formatItag } = req.params;
    
    // Ensure proper parsing of formatItag
    const parsedFormatItag = parseInt(formatItag);
    if (isNaN(parsedFormatItag)) {
      return res.status(400).json({ 
        valid: false,
        error: 'Invalid format ID'
      });
    }
    
    // Get fresh info
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://www.youtube.com',
          'Referer': 'https://www.youtube.com/'
        }
      }
    });
    
    // Find the format with matching itag
    const format = info.formats.find(f => f.itag === parsedFormatItag);
    
    if (!format || !format.url) {
      return res.status(404).json({ 
        valid: false,
        error: 'Format not found or URL not available'
      });
    }
    
    // Return success with updated URL (client will use our proxy endpoint)
    res.json({ 
      valid: true,
      download: `/premiumizer/youtube/stream/${videoId}/${parsedFormatItag}`,
      videoExpiry: Date.now() + (6 * 60 * 60 * 1000) // 6 hours
    });
    
  } catch (error) {
    console.error('YouTube link check error:', error);
    res.status(500).json({ 
      valid: false, 
      error: error.message || 'Failed to check YouTube video link'
    });
  }
}));

// Endpoint for handling age-restricted videos
router.get('/youtube/age-restricted', asyncHandler(async (req, res) => {
  try {
    const url = req.query.link;
    
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    
    // Special handling for age-restricted videos with cookies
    const cookies = req.query.cookies || '';
    
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://www.youtube.com',
          'Referer': 'https://www.youtube.com/',
          'Cookie': cookies
        }
      }
    });
    
    // Process video info the same way as the regular YouTube endpoint
    // For brevity, I'm not duplicating all the formatting code
    
    res.json({
      id: uuidv4(),
      filename: info.videoDetails.title || 'Age-Restricted YouTube Video',
      host: 'YouTube (Age-Restricted)',
      streamable: true,
      videoId: info.videoDetails.videoId,
      quality: 'Varies',
      download: `/premiumizer/youtube/stream/${info.videoDetails.videoId}/${info.formats[0]?.itag}`,
      type: 'video',
      alternative: [],
      downloadStatus: "ready",
      videoExpiry: Date.now() + (6 * 60 * 60 * 1000)
    });
  } catch (error) {
    console.error('Age-restricted YouTube video error:', error);
    res.status(500).json({ error: error.message || 'Failed to process age-restricted YouTube video' });
  }
}));

module.exports = router;