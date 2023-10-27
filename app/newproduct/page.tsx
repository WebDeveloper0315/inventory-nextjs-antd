'use client'
import PageTitle from '@/component/PageTitle'
import { Button, Col, Row } from 'antd'
import Link from 'next/link'
import React, { useState } from 'react'
import NewProductRegister from '@/component/NewProduct'
import NewUnits from '@/component/NewUnits'

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
        <Row gutter={[16, 16]}>
          <Col span={4}>

          </Col>
          <Col span={8}>
            
              <Button type='primary' block onClick={handleUnitsButtonClick}>
                <i className="ri-add-line">&nbsp;Units</i>
              </Button>  
               
          </Col>
          <Col span={8}>
            
              <Button type='primary' block onClick={handleNewButtonClick}>
                <i className="ri-file-list-3-line">&nbsp;New</i>
              </Button>  
            
          </Col>
        </Row>
      </div>
      {showRegister && <NewProductRegister />}
      {showUnits && <NewUnits />}
      
    </div>
  )
}

export default NewProduct
