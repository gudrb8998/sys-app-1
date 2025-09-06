// QRCodeComponent.js
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QRCodeComponent = () => {
  const url = 'https://sys-app-1.vercel.app/question';

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>QR Code for Question Page</h2>
      <QRCodeCanvas
        value={url}
        size={200}
        bgColor="#ffffff"
        fgColor="#000000"
        level="H"
        includeMargin={true}
      />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '50px',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    marginBottom: '20px',
    color: '#333',
  },
  urlText: {
    marginTop: '10px',
    color: '#555',
    fontSize: '14px',
    wordBreak: 'break-all',
    textAlign: 'center',
  },
};

export default QRCodeComponent;
