import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientService } from '../../../services';
import { useAuth } from '../../../context/AuthContext';
import FeedbackDisplay from '../../../components/FeedbackDisplay';
import TopBar from '../../../components/TopBar/TopBar';
import html2pdf from 'html2pdf.js';
import './ReportFeedback.css';

export default function ReportFeedback() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { currentProfile } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [reportDetails, setReportDetails] = useState({
    title: '',
    uploadedAt: '',
    filename: '',
    patientName: '',
    clinicDetails: {
      name: 'FLEXEASE MEDICAL CENTER',
      phone: '077 256 32 31',
      location: 'KOSSWATTA -RAJAGIRIYA'
    }
  });
  const [patientDetails, setPatientDetails] = useState({
    name: '',
    age: '',
    email: '',
    mobileNumber: '',
    gender: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format date nicely
  const formatDate = (dateString) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };
  // Load mobile number from localStorage
  useEffect(() => {
    const storedNumber = localStorage.getItem('contactMobileNumber');
    if (storedNumber) {
      setMobileNumber(storedNumber);
    }

    // Listen for mobile number updates
    const handleMobileNumberUpdate = (event) => {
      const { mobileNumber: updatedNumber } = event.detail;
      setMobileNumber(updatedNumber);
    };

    // Add event listener
    window.addEventListener('mobileNumberUpdated', handleMobileNumberUpdate);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('mobileNumberUpdated', handleMobileNumberUpdate);
    };
  }, []);

  useEffect(() => {
    // Fetch report details and patient details
    const fetchReportDetails = async () => {
      setLoading(true);
      try {
        // Use the first page with a small limit to minimize data transfer
        // Include sort parameter as per API documentation
        const response = await patientService.getReportFeedback(reportId, 1, 1, 'desc');

        // Get patient name from localStorage as fallback
        const patientName = response.patientName ||
                          localStorage.getItem('patientName') ||
                          'Patient';

        setReportDetails({
          title: response.reportTitle || 'Medical Assessment Report',
          uploadedAt: response.uploadedAt || new Date().toISOString(),
          filename: response.filename || 'Medical Report',
          reportId: reportId,
          patientName: patientName,
          clinicDetails: {
            name: 'FLEXEASE MEDICAL CENTER',
            phone: '077 256 32 31',
            location: 'KOSSWATTA -RAJAGIRIYA'
          }
        });

        // Get patient details from profile context or localStorage
        if (currentProfile) {
          setPatientDetails({
            name: currentProfile.name || currentProfile.fullName || patientName,
            age: currentProfile.age || '',
            email: currentProfile.email || localStorage.getItem('userEmail') || '',
            mobileNumber: currentProfile.mobileNumber || currentProfile.mobile || '',
            gender: currentProfile.gender || ''
          });
        } else {
          // Try to get from localStorage
          const profileString = localStorage.getItem('currentProfile');
          if (profileString) {
            try {
              const profile = JSON.parse(profileString);
              setPatientDetails({
                name: profile.name || profile.fullName || patientName,
                age: profile.age || '',
                email: profile.email || localStorage.getItem('userEmail') || '',
                mobileNumber: profile.mobileNumber || profile.mobile || '',
                gender: profile.gender || ''
              });
            } catch (e) {
              console.error('Error parsing profile from localStorage:', e);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching report details:', err);
        setError('We couldn\'t load your report details at this time. Please try again later or contact support for assistance.');
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      fetchReportDetails();
    } else {
      setError('No report ID was provided. Please select a valid report from your dashboard.');
      setLoading(false);
    }
  }, [reportId, currentProfile]);

  // PDF download handler
  const handleDownloadPDF = () => {
    const reportElement = document.getElementById('report-pdf-content');
    if (!reportElement) return;
    const opt = {
      margin: 0.2,
      filename: `Medical_Report_${reportDetails.patientName || 'Patient'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(reportElement).save();
  };

  return (
    <div className="report-feedback-page">
      <TopBar mobileNumber={mobileNumber} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="download-pdf-btn" onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>
      <div className="back-navigation">
        <button
          className="back-button"
          onClick={() => navigate(-1)}
        >
          &larr; Back to Reports
        </button>
      </div>
      {loading ? (
        <div className="medical-report-loading">Loading your medical report details...</div>
      ) : error ? (
        <div className="medical-report-error">
          <h3>Error Loading Report</h3>
          <p>{error}</p>
        </div>
      ) : (
        <div id="report-pdf-content" className="medical-report-container">
          <div className="medical-report-header">
            <h1 className="report-header-title">Medical Feedback Report</h1>
            <div className="medical-report-wave"></div>
          </div>

          <div className="medical-report-body">
            <div className="patient-details-section">
              <h3>Patient Details</h3>
              <div className="patient-details-grid">
                <div className="patient-detail-item">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{patientDetails.name || reportDetails.patientName}</span>
                </div>
                {patientDetails.age && (
                  <div className="patient-detail-item">
                    <span className="detail-label">Age:</span>
                    <span className="detail-value">{patientDetails.age} years</span>
                  </div>
                )}
                {patientDetails.gender && (
                  <div className="patient-detail-item">
                    <span className="detail-label">Gender:</span>
                    <span className="detail-value">{patientDetails.gender}</span>
                  </div>
                )}
                {patientDetails.email && (
                  <div className="patient-detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{patientDetails.email}</span>
                  </div>
                )}
                {patientDetails.mobileNumber && (
                  <div className="patient-detail-item">
                    <span className="detail-label">Contact:</span>
                    <span className="detail-value">{patientDetails.mobileNumber}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="report-meta-info">
              <div className="report-document-info">
                <p className="upload-date">Uploaded on {formatDate(reportDetails.uploadedAt)}</p>
                {reportDetails.filename && (
                  <p className="filename">{reportDetails.filename}</p>
                )}
              </div>
              <div className="report-id">
                <span>Report #</span> {reportId.substring(0, 8)}
              </div>
            </div>

            <div className="report-feedback-section">
              <h2 className="feedback-section-title">Medical Assessment</h2>
              <p className="feedback-section-subtitle">
                This report was reviewed by our medical team on {formatDate(reportDetails.uploadedAt)}
              </p>

              {/* Display the feedback with our enhanced component */}
              <div className="feedback-display-wrapper">
                <FeedbackDisplay
                  reportId={reportId}
                  initialPage={1}
                  showReportTitle={false}
                />
              </div>
            </div>
          </div>

          <div className="medical-report-footer">
            <div className="clinic-details">
              <p className="clinic-name">{reportDetails.clinicDetails.name}</p>
              <p className="clinic-phone">Phone: {reportDetails.clinicDetails.phone}</p>
              <p className="clinic-location">Address: {reportDetails.clinicDetails.location}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
