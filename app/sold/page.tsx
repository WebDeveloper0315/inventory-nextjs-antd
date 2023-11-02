'use client'
import PageTitle from '@/component/PageTitle'
import { Button, Form, Image, Input, Tooltip, message } from 'antd'
import React, { useState } from 'react'
import { InfoCircleOutlined, UserOutlined } from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import { SetLoading } from '@/redux/loadersSlice'
import axios from 'axios'

function Sold() {

  const dispatch = useDispatch()
  const [imageUrl, setImageUrl] = useState('')
  const [addUnits, setAddUnits] = useState(false)

  const onShowUnits = () => {
      setAddUnits(true)
  }

  const onHideUnits = () => {
      setAddUnits(false)
      setImageUrl('')
      // onHide()
  }

  const handleSubmit = async (code: string) => {
    try {
        dispatch(SetLoading(true))
        const encodedCode = encodeURIComponent(code)
        const response = await axios.get(`api/products/check?code=${encodedCode}`)

        const url = response.data?.data?.productImage
        setImageUrl(url)
        setAddUnits(false)
    } catch (error: any) {
        message.error(error.response?.data?.message || 'Something went wrong')
    } finally {
        dispatch(SetLoading(false))
    }
  }

  const handleEnterPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleSubmit(event.currentTarget.value);
    }
  }

  const onFinish = async (values: any) => {
    try {
        dispatch(SetLoading(true))
        console.log('SoldUnits.tsx onFinish', values)
        const response = await axios.post('api/products/recording?selling=1', values)
        console.log(response)
        if (response.status === 201) {
            message.success(response.data.message)
        }
        else {
            message.error(response.data.message || "Something Went Wrong!")
        }
        setImageUrl('')
    } catch (error: any) {
        // console.log(error)
        message.error( 'Something went wrong')
    } finally {
        dispatch(SetLoading(false))
    }
  }


  return (
    <div>
      <PageTitle title='Sold'/>
      <div>
        <Form
          layout='vertical'

          onFinish={onFinish}
        >
            <div className="flex justify-center">
                <Form.Item label="Product Code" name='code' className='lg:w-1/4 sm:w-1/2 md:w-1/3'>
                    <Input 
                        placeholder="#A0005" 
                        onPressEnter={handleEnterPress} 
                        suffix={
                            <Tooltip title="Press Enter Key after entering...">
                            <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                            </Tooltip>
                        }
                    />
                </Form.Item>
            </div>
            <div className="flex justify-center ">
                <div className='lg:w-1/4 sm:w-1/2 md:w-1/3'>
                    {/* {imageUrl && <BuyingUnits imageUrl={imageUrl} onHide={onHideBuyingUnits} />} */}
                    {imageUrl &&
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
                                    <div>
                                        <Form.Item label="Units Selling" name='units' className=' w-auto my-3'>
                                            <Input placeholder="units to sell" />
                                        </Form.Item>
                                        <Form.Item label="Price per Unit" name='pricePerUnit' className='my-3'>
                                            <Input placeholder="Price per unit" />
                                        </Form.Item>
                                        <Form.Item label="Market Place" name='market' className=' w-auto my-3'>
                                            <Input placeholder="Market Place" />
                                        </Form.Item>
                                        <Form.Item label="Taxes(%)" name='taxes' className=' w-auto my-3'>
                                            <Input placeholder="Tax" />
                                        </Form.Item>

                                        <Button type='primary' htmlType='submit' className='my-3' block>Confirm</Button>
                                    </div>
                                }
                            </div>

                        </div>
                    }
                </div>

            </div>
        </Form>
            </div>
    </div>
  )
}

export default Sold
