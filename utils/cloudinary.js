import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';


cloudinary.config({
    cloud_name: 'dhgqr0et2',
    api_key: '146475928654719',
    api_secret: 'PPsTW6TF1n5IwAy_pdFXn1WXqxw',
})


const fileUpload = async (file) => {
    console.log("file", file);
    try {
        const secure_url = await cloudinary.uploader.upload(file, {
            resource_type: 'auto',
        });

        console.log("secure_url", secure_url);

        fs.unlinkSync(file);

        return secure_url;

    } catch (error) {
        console.error('Error uploading file:', error);

        fs.unlinkSync(file);

        throw error;
    }
}

const deleteOldFile = async (file) => {
    try {

        const remove = await cloudinary.uploader.destroy(file);
        console.log("remove", remove);
        
        
    } catch (error) {
        console.error('Error deleting file:', error);
    }
}

export { fileUpload , deleteOldFile };


