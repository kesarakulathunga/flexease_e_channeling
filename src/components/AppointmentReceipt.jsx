import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './AppointmentReceipt.css';

/**
 * AppointmentReceipt - Component for generating a printable appointment receipt with QR code
 * @param {Object} props - Component props
 * @param {Object} props.appointment - Appointment details
 * @param {string} props.appointment.date - Appointment date (YYYY-MM-DD)
 * @param {string} props.appointment.time - Appointment time (HH:MM)
 * @param {string} props.appointment.patientName - Patient name
 * @param {string} props.appointment.patientEmail - Patient email
 * @param {string} props.appointment.paymentMethod - Payment method ('now' or 'later')
 */
const AppointmentReceipt = ({ appointment }) => {
  const {
    date,
    time,
    patientName,
    patientEmail,
    paymentMethod
  } = appointment;

  // Format date for display
  const formatDate = (dateStr) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  // Generate QR code data
  const qrCodeData = JSON.stringify({
    patientName,
    patientEmail,
    appointmentDate: date,
    appointmentTime: time,
    paymentMethod: paymentMethod === 'now' ? 'Paid Online' : 'Pay at Appointment',
    generated: new Date().toISOString()
  });

  // Handle print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="receipt-container">
      <div id="receipt-content">
        <div className="receipt-header">
          <h1>Appointment Confirmation Receipt</h1>
          <div className="date">Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</div>
        </div>

        <div className="receipt-body">
          <div className="receipt-info">
            <h2>Appointment Details</h2>
            <table>
              <tbody>
                <tr>
                  <th>Patient Name:</th>
                  <td>{patientName}</td>
                </tr>
                <tr>
                  <th>Email:</th>
                  <td>{patientEmail}</td>
                </tr>
                <tr>
                  <th>Date:</th>
                  <td>{formatDate(date)}</td>
                </tr>
                <tr>
                  <th>Time:</th>
                  <td>{time} (IST)</td>
                </tr>
                <tr>
                  <th>Payment Method:</th>
                  <td>{paymentMethod === 'now' ? 'Paid Online' : 'Pay at Appointment'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="qr-code-section">
            <h2>Appointment QR Code</h2>
            <div className="qr-code-container">
              <QRCodeSVG
                value={qrCodeData}
                size={200}
                level="H"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
            <p className="qr-instructions">
              Please present this QR code when you arrive for your appointment.
            </p>
          </div>
        </div>

        <div className="receipt-footer">
          <p>Thank you for choosing Flexease Physiotherapy Center.</p>
        </div>
      </div>

      <button className="download-btn" onClick={handlePrint}>
        Print Receipt
      </button>
    </div>
  );
};

export default AppointmentReceipt;
