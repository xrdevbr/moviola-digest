const { spawn, spawnSync, ipcRenderer, exec } = window.electron;
const ffprobePath = window.electron.ffprobePath;
const ffmpegPath = window.electron.ffmpegPath;
const path = window.electron.path; // Ensure path is available
const fs = window.electron.fs;
const adbPath = window.electron.adbPath;

if (!ffmpegPath) {
    console.error('ffmpegPath is undefined. Ensure ffmpeg-static is correctly installed.');
  }

const dropArea = document.getElementById('drop-area');
const startBtn = document.getElementById('start-btn');
const continueBtn = document.getElementById('continue-btn');
const statusDiv = document.getElementById('status');
const progressBar = document.getElementById('progress-bar');
const reloadButton = document.getElementById('reload-button');

// Proxy Settings Elements
const hardwareEncodingCheckbox = document.getElementById('hardware-encoding');
const smartScalingCheckbox = document.getElementById('smart-scaling');
const qualitySelect = document.getElementById('quality');
const resolutionSelect = document.getElementById('resolution');
const burnTimecodeCheckbox = document.getElementById('burn-timecode');
const editSettingsBtn = document.getElementById('edit-settings-btn');
const proxySettingsDiv = document.getElementById('proxy-settings');

const diggestedSuffix = '_digested';
let videoFiles = [];
let successfulConversions = [];
let failedConversions = [];
let validVideoCount = 0;

// Drag and Drop Event Listeners
dropArea.addEventListener('dragover', (event) => handleDragOver(event));
dropArea.addEventListener('dragleave', (event) =>handleDragLeave(event));
dropArea.addEventListener('drop', (event) => handleDrop(event));

// Restart Button Event Listener
reloadButton.addEventListener('click', handleRestart);

function handleDragOver(event) {
    event.preventDefault();
    console.log('Drag over event');
    dropArea.classList.add('drag-over');
    dropArea.textContent = 'Release to drop the files';
}
function handleDragLeave(event) {
    event.preventDefault();
    console.log('Drag leave event');
    dropArea.classList.remove('drag-over');
    dropArea.textContent = 'Drag & Drop Videos Here';
}
function handleDrop(event) {
    event.preventDefault();
    dropArea.classList.remove('drag-over');
    dropArea.classList.add('dropped');
    
  
    const droppedFiles = Array.from(event.dataTransfer.files);
  
    for (const file of droppedFiles) {
      if (isValidVideo(file.path)) {
        if (!videoFiles.includes(file.path)) {
          videoFiles.push(file.path);
          validVideoCount++;
        }
      } else {
        console.warn(`Skipping non-video file: ${file.path}`);
      }
    }
    dropArea.textContent = `${droppedFiles.length} files dropped. Videos: ${validVideoCount}`;
    
  
    setTimeout(() => {
      dropArea.classList.remove('dropped');
      dropArea.textContent = 'Drag & Drop Videos Here';
    }, 2000); // Remove the class and reset text after a short delay

    if (validVideoCount > 0){
        startBtn.hidden = false;
        statusDiv.textContent = `Ready to convert ${validVideoCount} valid videos.`;
    }
    
}
function handleRestart(){
    // restart everything
    location.reload();
}

editSettingsBtn.addEventListener('click', () => {
  if (proxySettingsDiv.style.display === 'none' || proxySettingsDiv.style.display === '') {
    proxySettingsDiv.style.display = 'flex';
    editSettingsBtn.textContent = 'Hide';
  } else {
    proxySettingsDiv.style.display = 'none';
    editSettingsBtn.textContent = 'Settings';
  }
});

// Start Conversion Button Event Listener (updated)
startBtn.addEventListener('click', async () => {

    console.log('ffmpegPath:' + ffmpegPath);
    console.log('ffprobePath:' + ffprobePath);
    dropArea.textContent = 'Conversion in progress...';    // Update the text content
    startBtn.hidden = true;
    dropArea.hidden = true;
    editSettingsBtn.hidden = true;
    
    statusDiv.textContent = "Converting videos...";
    progressBar.max = videoFiles.length;
    progressBar.value = 0;
    progressBar.hidden = false;
  
    const options = {
      useHardwareEncoding: hardwareEncodingCheckbox.checked,
      useSmartScaling: smartScalingCheckbox.checked,
      qualityLevel: qualitySelect.value,
      resolution: resolutionSelect.value,
      burnTimecode: burnTimecodeCheckbox.checked
    };

    console.log(options);
  
    for (const videoFile of videoFiles) {
      try {
        await convertVideo(videoFile, options);
        successfulConversions.push(path.basename(videoFile));
      } catch (err) {
        console.error(`Error converting ${videoFile}:`, err);
        failedConversions.push(path.basename(videoFile));
      } finally {
        progressBar.value++;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    progressBar.hidden = true;
  
    const successMessage = successfulConversions.length > 0
      ? `Success: ${successfulConversions.length}\n${successfulConversions.join('\n')}`
      : "No videos were successfully converted.";
  
    const failureMessage = failedConversions.length > 0
      ? `Failures: ${failedConversions.length}\n${failedConversions.join('\n')}`
      : "";
  
    statusDiv.textContent = `${successMessage}\n\n${failureMessage}`;
    
    // Conditional logic for the continue button
    if (successfulConversions.length > 0) {
        statusDiv.textContent += "\n\nConnect your Quest via USB and press the continue button to upload the videos.";
        continueBtn.hidden = false;
    } else {
        // No successful conversions, so don't show the continue button
        statusDiv.textContent += "\n\nNo videos to transfer."; 
    }
});


continueBtn.addEventListener('click', async () => {
    continueBtn.hidden = true; // Hide the continue button again
    statusDiv.textContent = "Transferring files...";
    let errorCount = 0;
    for (const videoFile of videoFiles) {
        if (!(await transferToQuest(videoFile))){
            errorCount++;
        }
    }
    if (errorCount > 0){
        continueBtn.hidden = false;
        return;
    }
    statusDiv.textContent = "Transfer complete!";
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 1 second
    handleRestart();
});

function isValidVideo(filePath) {
    try {
      // 1. Check File Extension (Basic Filter)
      const extension = path.extname(filePath).toLowerCase();
      console.log(extension);
      const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.mpg', '.mpeg']; 
      if (!videoExtensions.includes(extension)) {
        return false; // Quickly eliminate obvious non-video files
      }
  
    } catch (err) {
      console.error(`Error validating file ${filePath}:`, err);
      return false; // Consider as invalid if an error occurs
    }
    return true;
  }

// Function to check if an encoder is available
function checkEncoder(encoder) {
    const result = spawnSync(ffmpegPath, ['-encoders']);
    return result.stdout.toString().includes(encoder);
}

// async function getFrameRate(videoFile) {
//     return new Promise((resolve, reject) => {
//         const ffprobe = spawn(ffprobePath, [
//             '-v', 'error',
//             '-select_streams', 'v:0',
//             '-show_entries', 'stream=r_frame_rate',
//             '-of', 'default=noprint_wrappers=1:nokey=1',
//             videoFile
//         ]);
        
//         let frameRate = '';

//         ffprobe.stdout.on('data', (data) => {
//             frameRate += data.toString();
//         });

//         ffprobe.on('close', (code) => {
//             if (code === 0) {
//                 resolve(frameRate.trim());
//             } else {
//                 reject(new Error(`FFprobe error: ${code}`));
//             }
//         });

//         ffprobe.on('error', (err) => {
//             reject(err); 
//         });
//     });
// }


async function getFrameRate(videoFile) {
    return new Promise((resolve, reject) => {
        // Make sure paths are quoted to handle spaces
        const quotedFfprobePath = `"${ffprobePath}"`;
        const quotedVideoFile = `"${videoFile}"`;
        
        const command = `${quotedFfprobePath} -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 ${quotedVideoFile}`;
        
        console.log('Executing command:', command); // Add this for debugging
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error output:', stderr); // Add this for debugging
                reject(new Error(`FFprobe error: ${stderr || error.message}`));
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

// Function to get the font path
async function getFontPath() {
    try {
      const fontPath = await window.electron.getFontPath();
      return fontPath;
    } catch (error) {
      console.error('Error fetching font path:', error);
      throw error;
    }
  }

async function convertVideo(videoFile, options) {
    // Output file setup
    const outputDir = path.dirname(videoFile);
    const filenameBase = path.basename(videoFile, path.extname(videoFile));
    const digestedSuffix = '_digested';
    const outputVideo = `${outputDir}/${filenameBase}${digestedSuffix}.mp4`;
    const outputAudio = `${outputDir}/${filenameBase}${digestedSuffix}.ogg`;

    // Fetch frame rate
    const frameRate = await getFrameRate(videoFile).catch(err => {
        console.error('Error fetching frame rate:', err);
        throw err; // Rethrow the error to be handled by the caller
    });
    console.log("frame rate: " + frameRate);

    // FFmpeg arguments setup
    let ffmpegArgs = ['-hide_banner', '-loglevel', 'verbose', '-y', '-i', videoFile];

    // Determine video encoder
    let videoEncoder = 'libx264';
    if (options.useHardwareEncoding) {
        if (checkEncoder('h264_nvenc')) {
            videoEncoder = 'h264_nvenc';
        } else if (checkEncoder('h264_qsv')) {
            videoEncoder = 'h264_qsv';
        } else if (checkEncoder('h264_amf')) {
            videoEncoder = 'h264_amf';
        }
    }
    const fontPath = await getFontPath();
    const fontSize = Math.round(36 * options.resolution / 1080);
    // Determine scaling and timecode burning filters
    if (options.useSmartScaling) {
        let scalingFilter = `scale=${options.resolution}:${options.resolution},setsar=1`;
        if (options.burnTimecode) {
            // Convert frame rate from fraction to decimal 
            const decimalFrameRate = eval(frameRate).toFixed(2);
            scalingFilter += `,drawtext=fontfile='${fontPath}':text='${filenameBase} @ ${decimalFrameRate} \n TCR\\ ':timecode='00\\:00\\:00\\:00':rate=${frameRate}:fontsize=${fontSize}:fontcolor=white:box=1:boxcolor=0x00000088:x=(w-tw)/2:y=h-(2*lh)`;
        }
        ffmpegArgs.push('-vf', scalingFilter);
    } else if (options.burnTimecode) {
        ffmpegArgs.push('-vf', `drawtext=text='%{timecode} - %{n} - %{pts\\:hms}':x=(w-tw)/2:y=h-(2*lh):fontsize=${fontSize}:fontcolor=white`, '-noautorotate');
    }

    // Determine CRF based on quality level
    let crf = 23; // Default medium quality
    if (options.qualityLevel === 'verylow') crf = 28;
    else if (options.qualityLevel === 'low') crf = 26;
    else if (options.qualityLevel === 'high') crf = 20;
    else if (options.qualityLevel === 'veryhigh') crf = 18;

    // Exclude -sc_threshold and -bf when using hardware encoding
    if (options.useHardwareEncoding) {
        ffmpegArgs.push('-sc_threshold', '0', '-bf', '0');
    }

    console.log(`Using video encoder: ${videoEncoder}`);

    ffmpegArgs.push(
        '-c:v', videoEncoder,
        '-preset', 'medium',
        '-crf', crf.toString(),
        '-g', '1',
        '-keyint_min', '1',
        outputVideo,
        '-loglevel', 'error',
        '-vn',
        '-c:a', 'libvorbis',
        outputAudio
    );

    console.log('FFmpeg args:', ffmpegArgs);

    return new Promise((resolve, reject) => {
        // Use spawnSync to run the FFmpeg command synchronously
        const result = spawnSync(ffmpegPath, ffmpegArgs, { encoding: 'utf-8' });

        if (result.error) {
            reject(new Error(`FFmpeg process error: ${result.error.message}`));
        } else if (result.status !== 0) {
            reject(new Error(`FFmpeg process exited with code ${result.status}: ${result.stderr}`));
        } else {
            resolve(result.stdout);
        }
    });
}

// Check if a device is connected
async function isDeviceConnected() {
    try {
        const isConnected = await window.electron.isDeviceConnected();
        if (isConnected) {
            statusDiv.textContent = "Quest device detected and connected.";
        } else {
            statusDiv.textContent = "No Quest device detected. Connect your device and try again.";
        }
        return isConnected;
    } catch (error) {
        console.error('Error checking device connection:', error);
        statusDiv.textContent = "Error checking device connection.";
        return false;
    }
}

// File Transfer Function
async function transferFile(filePath) {
    try {
        await window.electron.transferFile(filePath);
    } catch (error) {
        throw new Error(`Failed to transfer file: ${filePath}, error: ${error.message}`);
    }
}

// File Transfer Function
async function transferToQuest(videoFile) {
    if (!(await isDeviceConnected())) {
        return false;
    }

    const filenameBase = path.basename(videoFile, path.extname(videoFile));
    const outputVideo = `${path.dirname(videoFile)}/${filenameBase}${diggestedSuffix}.mp4`;
    const outputAudio = `${path.dirname(videoFile)}/${filenameBase}${diggestedSuffix}.ogg`;

    try {
        await transferFile(outputVideo);
        await transferFile(outputAudio);
        console.log('Files transferred successfully!');
        statusDiv.textContent = 'Files transferred successfully!';
    } 
    catch (error) {
        let errorMessage = `Error while transferring files: ${error.message}`;
        statusDiv.textContent = errorMessage;
        console.error(errorMessage);
        return false;
    }
    return true;
}