import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function uploadHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('-------------------')
    const form = new formidable.IncomingForm();

    // Parse the incoming form data
    form.parse(req, async (err, fields, files) => {
      if (err) {
        throw new Error('Error parsing form data');
      }

      // Get the uploaded image file
      const imageFile = files.image;

      // Check if file exists
      if (!imageFile) {
        throw new Error('Image file is missing');
      }

      // Create a unique file name using a combination of timestamp and original file name
      const fileName = `${Date.now()}-${imageFile.name}`;
      console.log(fileName)
      // Move the file to the desired location on the server
      const newPath = `public/productImage/${fileName}`;
      fs.renameSync(imageFile.path, newPath);

      // Return the file path or any other relevant response
      res.status(200).json({ imagePath: newPath });
    });
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
}
