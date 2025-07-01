// import React, { useState, useEffect } from 'react';
// import './MedicalHistory.css';

// export default function MedicalHistory() {
//   const [medicalHistory, setMedicalHistory] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     // Load medical history data
//     const loadMedicalHistory = async () => {
//       try {
//         setLoading(true);
//         // Add your API call here
//         // const response = await medicalService.getMedicalHistory();
//         // setMedicalHistory(response.data);
        
//         // Placeholder data for now
//         setMedicalHistory([
//           {
//             id: 1,
//             date: '2025-06-15',
//             type: 'Appointment',
//             description: 'Regular checkup',
//             doctor: 'Dr. Smith'
//           },
//           {
//             id: 2,
//             date: '2025-05-20',
//             type: 'Lab Report',
//             description: 'Blood test results',
//             doctor: 'Dr. Johnson'
//           }
//         ]);
//       } catch (err) {
//         setError('Failed to load medical history');
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadMedicalHistory();
//   }, []);

//   if (loading) {
//     return (
//       <div className="medical-history-container">
//         <h1>Medical History</h1>
//         <div className="loading">Loading your medical history...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="medical-history-container">
//         <h1>Medical History</h1>
//         <div className="error">{error}</div>
//       </div>
//     );
//   }

//   return (
//     <div className="medical-history-container">
//       <h1>Medical History</h1>
      
//       <div className="history-list">
//         {medicalHistory.length > 0 ? (
//           medicalHistory.map(record => (
//             <div key={record.id} className="history-item">
//               <div className="history-date">{record.date}</div>
//               <div className="history-content">
//                 <h3>{record.type}</h3>
//                 <p>{record.description}</p>
//                 <span className="history-doctor">{record.doctor}</span>
//               </div>
//             </div>
//           ))
//         ) : (
//           <div className="empty-state">
//             <p>No medical history found.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
