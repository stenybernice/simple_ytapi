const apiKey = 'your api key here';

document.getElementById('searchButton').addEventListener('click', async () => {
    const query = document.getElementById('searchQuery').value.trim();
    if (!query) return;
    
    try {
        const videos = await fetchYouTubeVideos(query);
        displayVideos(videos);
        displayProgress();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to fetch videos. Please try again.');
    }
});

async function fetchYouTubeVideos(query) {
    const searchEndpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=viewCount&maxResults=10&q=${encodeURIComponent(query)}&key=${apiKey}`;
    const searchResponse = await fetch(searchEndpoint);
    if (!searchResponse.ok) throw new Error('YouTube API Error');
    
    const searchData = await searchResponse.json();
    const videoIds = searchData.items.map(video => video.id.videoId).join(',');
    
    const detailsEndpoint = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`;
    const detailsResponse = await fetch(detailsEndpoint);
    if (!detailsResponse.ok) throw new Error('YouTube Details Error');
    
    const detailsData = await detailsResponse.json();
    
    return searchData.items
        .map((video, index) => ({
            ...video,
            duration: parseISO8601Duration(detailsData.items[index].contentDetails.duration)
        }))
        .filter(video => video.duration > 60);
}

function parseISO8601Duration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    return (parseInt(match[1] || 0) * 3600) +
           (parseInt(match[2] || 0) * 60) +
           parseInt(match[3] || 0);
}

function displayVideos(videos) {
    const videoResults = document.getElementById('videoResults');
    videoResults.innerHTML = videos.map(video => `
        <div class="col">
            <div class="card h-100">
                <img src="${video.snippet.thumbnails.medium.url}" class="card-img-top" alt="${video.snippet.title}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${video.snippet.title}</h5>
                    <div class="mt-auto">
                        <button class="btn btn-primary w-100 mb-2" 
                            onclick="playVideo('${video.id.videoId}', '${video.snippet.title}')">
                            Play Video
                        </button>
                        <button class="btn btn-success w-100" 
                            onclick="trackProgress('${video.id.videoId}', '${video.snippet.title}', ${video.duration})">
                            Mark as Watched
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function trackProgress(videoId, title, duration) {
    const percentage = Math.floor(Math.random() * 51) + 50; // 50-100%
    const progressLog = document.getElementById('progressLog');
    
    progressLog.innerHTML = `
        <div class="progress mb-3">
            <div class="progress-bar bg-success" 
                role="progressbar" 
                style="width: ${percentage}%" 
                aria-valuenow="${percentage}" 
                aria-valuemin="0" 
                aria-valuemax="100">
                ${title} - ${percentage}% watched
            </div>
        </div>
    ` + progressLog.innerHTML;
}

function playVideo(videoId, title) {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('modalVideoPlayer');
    
    document.getElementById('videoModalLabel').textContent = title;
    player.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}" 
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen></iframe>`;

    const videoModal = new bootstrap.Modal(modal);
    modal.addEventListener('hidden.bs.modal', () => {
        player.innerHTML = ''; // Stop video playback
    });
    videoModal.show();
}

function displayProgress() {
    const log = document.getElementById('progressLog');
    if (!log.innerHTML.trim()) {
        log.innerHTML = `<div class="text-muted">No videos watched yet. Click "Mark as Watched" to track progress.</div>`;
    }
}