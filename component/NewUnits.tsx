'use client'
import PageTitle from '@/component/PageTitle'
import { SetLoading } from '@/redux/loadersSlice'
import { Form, Input, message } from 'antd'
import axios from 'axios'
import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import BuyingUnits from './BuyingUnits'

function NewUnits() {
    const dispatch = useDispatch()
    const [imageUrl, setImageUrl] = useState('')

    const handleSubmit = async (values: any) => {
        try {
          dispatch(SetLoading(true))
          // Perform the product code check here
          const productCode = values?.target?.value || '';

          const response = await axios.get(`api/products/check?code=${productCode}`)
          
          const url = response.data.data.productImage
          setImageUrl(url)
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Something went wrong')
        } finally {
          dispatch(SetLoading(false))
        }
      }

      const onHideBuyingUnits = () => {
        setImageUrl('')
      }

    const onFinish = async(values: any) => {
        try {
            dispatch(SetLoading(true))
            
            // router.push("/")
        } catch (error: any) {
            message.error(error.response.data.message || 'Something went wrong')
        } finally {
            dispatch(SetLoading(false))
        }
    }
  return (
    <div>
        <Form
            layout='vertical'
            onFinish={onFinish}
        >
            <div className="flex justify-center">
                <Form.Item label="Product Code" name='code' className='lg:w-1/4 sm:w-1/2 md:w-1/3'>
                    <Input placeholder="#A0005" onPressEnter={handleSubmit}/>
                </Form.Item>
            </div>
            <div className="flex justify-center ">
                <div className = 'lg:w-1/4 sm:w-1/2 md:w-1/3'>
                    {imageUrl && <BuyingUnits imageUrl={imageUrl} onHide={onHideBuyingUnits} />}
                </div>
                
            </div>
        </Form>
      
    </div>
  )
}

export default NewUnits