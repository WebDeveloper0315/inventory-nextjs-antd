'use client'
import React, { useState } from 'react';
import { Upload, Button, Input, Form } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import PageTitle from '@/component/PageTitle';

const { Dragger } = Upload;

function NewProductRegister() {
    const [productCode, setProductCode] = useState('');
    const [productImage, setProductImage] = useState<File | null>(null);
    const [disposableUnits, setDisposableUnits] = useState('');
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [location, setLocation] = useState('');

    const handleFileChange = (file: File) => {
        setProductImage(file);
    };

    const handleUpload = () => {
        if (productImage) {
            const formData = new FormData();
            formData.append('image', productImage);
            formData.append('productCode', productCode);
            formData.append('disposableUnits', disposableUnits);
            formData.append('pricePerUnit', pricePerUnit);
            formData.append('location', location);

            // Call the API/upload function to upload the image and form data to the server
            // Example: axios.post('/api/upload', formData).then(...);
            console.log('Uploaded Form Data:', formData);
        } else {
            console.log('No image selected');
        }
    };

    return (
        <div>
            <PageTitle title='New Product' />
            <Form
                layout='vertical'
            >
                <div className="flex justify-center">
                    <Form.Item label="Product Code" className='lg:w-1/4 sm:w-1/2 md:w-1/3'>
                        <Input value={productCode} onChange={(e) => setProductCode(e.target.value)} />
                    </Form.Item>
                </div>
                <div className="flex justify-center">
                    <Form.Item label="Product Image" className='lg:w-1/4 sm:w-1/2 md:w-1/3'>
                        <Dragger
                            accept=".png,.jpg,.jpeg"
                            beforeUpload={(file) => {
                                handleFileChange(file);
                                return false; // Prevent default upload behavior
                            }}
                            showUploadList={false}
                        >
                            {productImage ? (
                                <img src={URL.createObjectURL(productImage)} alt="Product Image" style={{ width: '300px' }} />
                            ) : (
                                <div>
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined />
                                    </p>
                                    <p className="ant-upload-text">Click or drag image to this area to upload</p>
                                    <p className="ant-upload-hint">Support for PNG, JPG, and JPEG files</p>
                                </div>
                            )}
                        </Dragger>
                    </Form.Item>
                </div>

                {/* Other form inputs */}
                <div className="flex justify-center">
                    <Form.Item label="Disposable Units" className='lg:w-1/4 sm:w-1/2 md:w-1/3'>
                        <Input value={disposableUnits} onChange={(e) => setDisposableUnits(e.target.value)} />
                    </Form.Item>
                </div>

                <div className="flex justify-center">
                    <Form.Item label="Price Per Unit" className='lg:w-1/4 sm:w-1/2 md:w-1/3'>
                        <Input value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} />
                    </Form.Item>
                </div>

                <div className="flex justify-center">
                    <Form.Item label="Location" className='lg:w-1/4 sm:w-1/2 md:w-1/3'>
                        <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                    </Form.Item>
                </div>

                <div className="flex justify-center">
                    <Form.Item >
                        <Button type="primary" onClick={handleUpload} className='my-2'>Upload</Button>
                    </Form.Item>
                </div>
            </Form>
        </div>
    );
}

export default NewProductRegister;
