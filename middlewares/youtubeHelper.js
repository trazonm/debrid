/**
 * YouTube helper functions for handling various download scenarios
 */
const ytdl = require('ytdl-core');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Default user agent to mimic a real browser
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

/**
 * Extract video information from YouTube URL using multiple methods
 * @param {string} url - YouTube video URL
 * @returns {Promise<Object>} - Video information
 */
async function getVideoInfo(url) {
    try {
        // First attempt: Standard ytdl-core with browser headers
        return await ytdl.getInfo(url, {
            requestOptions: {
                headers: {
                    'User-Agent': DEFAULT_USER_AGENT,
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Origin': 'https://www.youtube.com',
                    'Referer': 'https://www.youtube.com/'
                }
            }
        });
    } catch (error) {
        console.error('Primary extraction method failed:', error.message);
        
        // Second attempt: Try with different options
        try {
            return await ytdl.getInfo(url, {
                requestOptions: {
                    headers: {
                        'User-Agent': DEFAULT_USER_AGENT,
                    }
                }
            });
        } catch (fallbackError) {
            console.error('Secondary extraction method failed:', fallbackError.message);
            throw new Error('Could not extract video information. YouTube may have updated their site.');
        }
    }
}

/**
 * Format video info into a structure matching our download API
 * @param {Object} info - Video information from ytdl
 * @returns {Object} - Formatted video data
 */
function formatVideoData(info) {
    if (!info || !info.formats || !info.videoDetails) {
        throw new Error('Invalid video information structure');
    }
    
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio').filter(format => format.url);
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly').filter(format => format.url);
    
    if (formats.length === 0 && audioFormats.length === 0) {
        throw new Error('No available formats found. This may be due to YouTube restrictions.');
    }
    
    // Pick the best format as default
    let mainFormat = formats[0] || audioFormats[0];
    
    const result = {
        id: uuidv4(),
        filename: info.videoDetails.title || 'YouTube Video',
        host: 'YouTube',
        streamable: true,
        quality: mainFormat?.qualityLabel || mainFormat?.audioBitrate + 'kbps' || 'Unknown',
        download: mainFormat?.url || '',
        type: formats.length > 0 ? 'video' : 'audio',
        alternative: []
    };
    
    // Add video formats as alternatives
    formats.slice(1).forEach(format => {
        if (format.url) {
            result.alternative.push({
                id: uuidv4(),
                filename: `${info.videoDetails.title} [${format.qualityLabel}]`,
                quality: format.qualityLabel || 'Unknown',
                streamable: true,
                download: format.url,
                type: 'video'
            });
        }
    });
    
    // Add audio formats
    audioFormats.forEach(format => {
        if (format.url) {
            result.alternative.push({
                id: uuidv4(),
                filename: `${info.videoDetails.title} [Audio ${format.audioBitrate}kbps]`,
                quality: `Audio ${format.audioBitrate}kbps`,
                streamable: true,
                download: format.url,
                type: 'audio'
            });
        }
    });
    
    return result;
}

module.exports = {
    getVideoInfo,
    formatVideoData
};
