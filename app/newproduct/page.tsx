/* eslint-disable tailwindcss/no-custom-classname */
'use client'
import PageTitle from '@/component/PageTitle'
import { Button, Col, Row } from 'antd'
import React, { useState } from 'react'
import NewProductRegister from '@/component/NewProduct'
import BuyingUnits from '@/component/BuyingUnits'
import { BiCartAdd } from "react-icons/bi"; 
import { FaCashRegister } from "react-icons/fa"; 

function NewProduct() {
  const [showRegister, setShowRegister] = useState(false);
  const [showUnits, setShowUnits] = useState(false);

  const handleNewButtonClick = () => {
    setShowRegister(true);
    setShowUnits(false);
  };

  const handleUnitsButtonClick = () => {
    setShowRegister(false);
    setShowUnits(true);
  };

  return (
    <div>
      <PageTitle title='New Product'/>
      <div className='my-3'>
        <Row gutter={[16, 16]} >
          <Col span={4}>
            
          </Col>
          <Col span={8}>
            
              <Button type='primary' block onClick={handleUnitsButtonClick}>
                <b className='text-2xl'><BiCartAdd />&nbsp;Buying</b>
              </Button>  
               
          </Col>
          <Col span={8}>
            
              <Button type='primary' block onClick={handleNewButtonClick}>
                <b className='text-2xl'><FaCashRegister />&nbsp;Register</b>
              </Button>  
            
          </Col>
        </Row>
      </div>
      {showRegister && <NewProductRegister />}
      {showUnits && <BuyingUnits />}
      
    </div>
  )
}

export default NewProduct
