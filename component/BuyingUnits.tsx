'use client'
import { Button, Form, Image, Input } from 'antd'
import React, { useState } from 'react'

function BuyingUnits({imageUrl, onHide} : {imageUrl: string, onHide: () => void}) {
    const [addUnits, setAddUnits] = useState(false)

    const onShowUnits = () => {
        setAddUnits(true)
    }

    const onHideUnits = () => {
        setAddUnits(false)
        onHide()
    }
  return (
    <div className='flex flex-col items-center'>
        <div className='flex flex-col items-center w-auto' >
            <p>Is this product?</p> 
            <Image
                src={imageUrl}
                className='w-auto'
            />
        </div>
        <div className='flex flex-row items-center'>
            <Button type="primary" style={{ margin: '10px' }} onClick={onShowUnits}>Yes</Button>
            <Button type="default" style={{ margin: '10px' }} onClick={onHideUnits}>No</Button> 
        </div>

        <div className=' w-auto'>
            {addUnits && 
                <div className='flex flex-col justify-center items-center'>
                    <Form.Item label="Units Buy" name='unitsBuy' className=' w-auto my-3'>
                        <Input placeholder="123"/>
                    </Form.Item>
                    <Form.Item label="Price per Unit" name='priceUnit' className='my-3'>
                        <Input placeholder="123"/>
                    </Form.Item>

                    <Button type='primary' className='my-3'>Confirm</Button>
                </div>
            }
        </div>

    </div>
  )
}

export default BuyingUnits
