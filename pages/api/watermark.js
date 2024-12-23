import { createCanvas, loadImage } from 'canvas';
import GIFEncoder from 'gifencoder';
import axios from 'axios';
import path from 'path';
import { parseGIF, decompressFrames } from 'gifuct-js';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
        responseLimit: '10mb'
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { imageUrl } = req.body;

        // Load watermark
        const watermarkPath = path.join(process.cwd(), 'public', 'watermark.png');
        const watermarkImage = await loadImage(watermarkPath);

        // Download GIF
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
       
        const buffer = Buffer.from(response.data);

        // Parse GIF
        const gif = parseGIF(buffer);
        const frames = decompressFrames(gif, true);

        // Set up canvas with original GIF dimensions
        const width = frames[0].dims.width;
        const height = frames[0].dims.height;

        // Calculate watermark size (20% of GIF width)
        const watermarkWidth = Math.floor(width * 0.20);
        const watermarkHeight = Math.floor(watermarkWidth * (watermarkImage.height / watermarkImage.width));

        // Set up GIF encoder with optimal settings
        const encoder = new GIFEncoder(width, height);
        encoder.start();
        encoder.setRepeat(0);
        encoder.setDelay(frames[0].delay);
        encoder.setQuality(10);
        encoder.setTransparent(null);

        // Create main canvas
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Create frame canvas
        const frameCanvas = createCanvas(width, height);
        const frameCtx = frameCanvas.getContext('2d');

        let previousFrame = null;

        // Process each frame
        for (const frame of frames) {
            // Update delay for this frame
            encoder.setDelay(frame.delay);

            // Clear the main canvas completely
            ctx.clearRect(0, 0, width, height);

            // Handle disposal method properly
            if (previousFrame && frame.disposalType === 1) { // Keep previous frame
                ctx.drawImage(previousFrame, 0, 0);
            }

            // Draw the new frame
            frameCtx.clearRect(0, 0, width, height);
            const imageData = frameCtx.createImageData(frame.dims.width, frame.dims.height);
            imageData.data.set(new Uint8ClampedArray(frame.patch));
            frameCtx.putImageData(imageData, 0, 0);

            ctx.drawImage(
                frameCanvas,
                frame.dims.left,
                frame.dims.top,
                frame.dims.width,
                frame.dims.height
            );

            // Store the current frame for the next iteration
            previousFrame = createCanvas(width, height);
            const prevCtx = previousFrame.getContext('2d');
            prevCtx.drawImage(canvas, 0, 0);

            // Add watermark with positioning and opacity
            ctx.globalAlpha = 0.5;
            ctx.drawImage(
                watermarkImage,
                10,
                height - watermarkHeight - 10,
                watermarkWidth,
                watermarkHeight
            );
            ctx.globalAlpha = 1.0;

            // Add frame to GIF
            encoder.addFrame(ctx);
        }

        encoder.finish();

        // Convert to base64
        const gifBuffer = encoder.out.getData();
        const base64Gif = `data:image/gif;base64,${gifBuffer.toString('base64')}`;

        res.status(200).json({ watermarkedImage: base64Gif });

    } catch (error) {
        console.error('Watermarking error:', error);
        res.status(500).json({
            error: 'Failed to watermark image',
            details: error.message
        });
    }
}
