const go = require("./lib/syntree");

function handle(str = "", font_size_update, vert_space_update, hor_space_update) {
  try {
    // Initialize the various options (these will be passed in the API call)
    let term_font = "";
    let nonterm_font = "";
    let color = false;
    let term_lines = false;

    // Here, we are assuming `str` and other options are passed directly via API parameters.
    let font_size = font_size_update || 12; // Set a default font size
    let vert_space = vert_space_update || 50; // Default vertical space
    let hor_space = hor_space_update || 70;  // Default horizontal space

    // Construct the fonts (for simplicity, omitting radio button selections)
    term_font = `${term_font}${font_size}pt Arial`; // Default to Arial
    nonterm_font = `${nonterm_font}${font_size}pt Arial`;

    // Generate the image using the 'go' function
    const img = go(
      str,
      font_size,
      term_font,
      nonterm_font,
      vert_space,
      hor_space,
      color,
      term_lines
    );

    // Assuming 'go()' returns an image object compatible with canvas.
    // In Node.js, you can use `canvas` to create a base64 image.
    const { createCanvas, loadImage } = require('canvas'); // 'canvas' package required
    const canvas = createCanvas(800, 600); // Create a canvas
    const context = canvas.getContext("2d");

    // Assuming 'img' is a valid image, we will draw it on the canvas.
    context.drawImage(img, 0, 0);

    // Convert canvas to base64 (Data URL)
    const base64Image = canvas.toDataURL("image/png");

    // Return the base64 image as the API response
    return { imageSrc: base64Image };
  } catch (err) {
    return { error: err.message };
  }
}

module.exports = { handle };
