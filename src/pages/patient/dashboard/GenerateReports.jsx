// src/pages/patient/dashboard/GenerateReports.jsx
import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import './GenerateReports.css';

// Activity level options for dropdown with their multiplier values
const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)', multiplier: 1.2 },
  { value: 'lightly', label: 'Lightly active (1–3 days/week)', multiplier: 1.375 },
  { value: 'moderately', label: 'Moderately active (3–5 days/week)', multiplier: 1.55 },
  { value: 'very', label: 'Very active (6–7 days/week)', multiplier: 1.725 },
  { value: 'extra', label: 'Extra active (hard exercise or physical job)', multiplier: 1.9 }
];

export default function GenerateReports() {
  const { token } = useAuth(); // Keeping auth context in case it's needed elsewhere
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    sex: '',
    activityLevel: ''
  });
  const [showResults, setShowResults] = useState(false);
  const [metrics, setMetrics] = useState({});
  const [reportGenerated, setReportGenerated] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateMetrics = (data) => {    const { weight, height, age, sex, activityLevel } = data;
    const weightKg = parseInt(weight);
    const heightCm = parseInt(height);
    const heightM = heightCm / 100;
    const ageYears = parseInt(age);
    const isMale = sex === 'male';

    // BMI calculation
    const bmi = weightKg / (heightM * heightM);

    // BMR calculation using Mifflin-St Jeor Equation
    let bmr;
    if (isMale) {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
    }

    // TDEE calculation
    let tdee;
    switch(activityLevel) {
      case 'sedentary':
        tdee = bmr * 1.2;
        break;
      case 'lightly':
        tdee = bmr * 1.375;
        break;
      case 'moderately':
        tdee = bmr * 1.55;
        break;
      case 'very':
        tdee = bmr * 1.725;
        break;
      case 'extra':
        tdee = bmr * 1.9;
        break;
      default:
        tdee = bmr * 1.2;
    }

    // Ideal weight range calculation using BMI method
    const idealWeightLower = 18.5 * (heightM * heightM);
    const idealWeightUpper = 24.9 * (heightM * heightM);

    // Body fat percentage estimation using BMI method
    // Note: This is a rough estimate and not as accurate as direct measurements
    let bodyFat;
    if (isMale) {
      bodyFat = (1.20 * bmi) + (0.23 * ageYears) - 16.2;
    } else {
      bodyFat = (1.20 * bmi) + (0.23 * ageYears) - 5.4;
    }

    return {
      bmi: bmi.toFixed(1),
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      idealWeight: `${idealWeightLower.toFixed(1)} - ${idealWeightUpper.toFixed(1)} kg`,
      bodyFat: bodyFat.toFixed(1)
    };
  };  const generateReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReportGenerated(false);
    
    try {
      // Validate inputs
      const { weight, height, age, sex, activityLevel } = formData;
      
      if (!weight || !height || !age || !sex || !activityLevel) {
        throw new Error('All fields are required');
      }
      
      if (isNaN(parseInt(weight)) || parseInt(weight) <= 0 || parseInt(weight) > 200) {
        throw new Error('Weight must be a whole number between 1-200 kg');
      }

      if (isNaN(parseInt(height)) || parseInt(height) <= 0 || parseInt(height) > 250) {
        throw new Error('Height must be a whole number between 1-250 cm');
      }

      if (isNaN(parseInt(age)) || parseInt(age) <= 0 || parseInt(age) > 100) {
        throw new Error('Age must be a whole number between 1-100 years');
      }
      
      // Calculate metrics locally
      const calculatedMetrics = calculateMetrics(formData);
      setMetrics(calculatedMetrics);
      setReportGenerated(true);
      
      // Open report tabs with locally calculated metrics
      openReportTabs(calculatedMetrics);
      
      // Show results
      setShowResults(true);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };  // Function to open report tabs
  const openReportTabs = (metricsData) => {
    if (!metricsData) return;
    
    // Calculate additional metrics
    const weightKg = parseInt(formData.weight);
    const heightCm = parseInt(formData.height);
    const heightM = heightCm / 100;
    const bmi = parseFloat(metricsData.bmi);
    const bodyFat = parseFloat(metricsData.bodyFat);
    
    // Calculate Body Surface Area using Mosteller formula
    const bsa = Math.sqrt((weightKg * heightCm) / 3600).toFixed(2);
    
    // Calculate Ideal Body Weight using Devine formula
    let ibw;
    if (formData.sex === 'male') {
      ibw = (50 + 2.3 * ((heightCm / 2.54) - 60)).toFixed(1);
    } else {
      ibw = (45.5 + 2.3 * ((heightCm / 2.54) - 60)).toFixed(1);
    }
    
    // Calculate Fat Mass and Lean Mass
    const fatMass = (weightKg * (bodyFat / 100)).toFixed(1);
    const leanMass = (weightKg - fatMass).toFixed(1);
    
    // Calculate activity calories
    const bmr = parseInt(metricsData.bmr);
    const tdee = parseInt(metricsData.tdee);
    const activityCalories = tdee - bmr;
    
    // Get activity multiplier text
    let activityMultiplier;
    switch(formData.activityLevel) {
      case 'sedentary': activityMultiplier = "Sedentary (× 1.2)"; break;
      case 'lightly': activityMultiplier = "Lightly active (× 1.375)"; break;
      case 'moderately': activityMultiplier = "Moderately active (× 1.55)"; break;
      case 'very': activityMultiplier = "Very active (× 1.725)"; break;
      case 'extra': activityMultiplier = "Extra active (× 1.9)"; break;
      default: activityMultiplier = "Not specified";
    }
    
    // PDF generation options for better A4 formatting
    const pdfConfig = `
      function downloadPDF(filename) {
        const element = document.getElementById('report-content');
        const opt = {
          margin: [15, 15, 15, 15],
          filename: filename + '.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 794, // A4 width in pixels at 96 DPI
            windowHeight: 1123 // A4 height in pixels at 96 DPI
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true,
            hotfixes: ["px_scaling"]
          },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        // Show loading indicator
        const loadingMessage = document.createElement('div');
        loadingMessage.innerText = 'Generating PDF, please wait...';
        loadingMessage.style.position = 'fixed';
        loadingMessage.style.top = '50%';
        loadingMessage.style.left = '50%';
        loadingMessage.style.transform = 'translate(-50%, -50%)';
        loadingMessage.style.background = 'rgba(0,0,0,0.7)';
        loadingMessage.style.color = 'white';
        loadingMessage.style.padding = '20px';
        loadingMessage.style.borderRadius = '10px';
        loadingMessage.style.zIndex = '9999';
        document.body.appendChild(loadingMessage);
        
        // Generate PDF
        html2pdf()
          .set(opt)
          .from(element)
          .save()
          .then(() => {
            document.body.removeChild(loadingMessage);
          })
          .catch(err => {
            console.error('Error generating PDF:', err);
            document.body.removeChild(loadingMessage);
            alert('There was an error generating the PDF. Please try again.');
          });
      }
    `;
    
    // Create Anthropometrics Report Tab (Report A)
    // Center the report content on the page by adding a wrapper div and centering styles
    const anthropometricsReportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Anthropometrics Report</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          html {
            zoom: 1;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          html, body {
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            background-color: white;
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: black;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
            box-sizing: border-box;
            background: white;
          }
          .centered-report-wrapper {
            width: 100%;
            max-width: 900px;
            margin: 40px auto;
            background: white;
            padding: 20mm;
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.07);
            box-sizing: border-box;
          }
          h1, h2 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
          }
          .report-header { margin-bottom: 30px; }
          .date { color: #7f8c8d; margin-top: 10px; font-style: italic; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11pt; }
          th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f8f9fa; }
          .chart-container {
            display: flex;
            flex-direction: column;
            margin: 20px 0;
            page-break-inside: avoid;
          }
          .chart-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            width: 100%;
            margin-bottom: 20px;
            box-sizing: border-box;
            page-break-inside: avoid;
          }
          .chart-box h3 { margin-top: 0; color: #3498db; }
          .metrics-row { margin-bottom: 20px; page-break-inside: avoid; }
          .metrics-container { width: 100%; }
          .interpretation { background: #e8f4f8; padding: 10px; border-radius: 8px; margin: 15px 0; font-size: 10pt; }
          canvas { margin: 10px auto; max-height: 200px; width: auto !important; height: auto !important; }
          figure { margin: 15px 0; text-align: center; }
          figcaption { margin-top: 5px; font-weight: bold; color: #555; font-size: 10pt; }
          .download-btn {
            background-color: #27ae60;
            color: white;
            border: none;
            padding: 12px 20px;
            font-size: 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 20px;
            display: inline-block;
          }
          .download-btn:hover {
            background-color: #219653;
          }
          @media print {
            .download-btn {
              display: none;
            }
            body {
              width: 100%;
              height: auto;
            }
            .chart-box {
              width: 100%;
              break-inside: avoid;
            }
            h1, h2, h3 {
              break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="centered-report-wrapper">
          <div id="report-content">
            <div class="report-header">
              <h1>Anthropometrics Report</h1>
              <div class="date">Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
            </div>
            
            <div class="metrics-row">
              <div class="metrics-container">
                <h2>1. Inputs & Outputs Table</h2>
                <table>
                  <tr>
                    <th>Input</th>
                    <th>Value</th>
                    <th>Output Metric</th>
                    <th>Value</th>
                  </tr>
                  <tr>
                    <td>Weight (kg)</td>
                    <td>${weightKg}</td>
                    <td>BMI</td>
                    <td>${bmi} kg/m²</td>
                  </tr>
                  <tr>
                    <td>Height (cm)</td>
                    <td>${heightCm}</td>
                    <td>BSA</td>
                    <td>${bsa} m²</td>
                  </tr>
                  <tr>
                    <td>Age (years)</td>
                    <td>${formData.age}</td>
                    <td>IBW</td>
                    <td>${ibw} kg</td>
                  </tr>
                  <tr>
                    <td>Sex</td>
                    <td>${formData.sex.charAt(0).toUpperCase() + formData.sex.slice(1)}</td>
                    <td>Body Fat %</td>
                    <td>${bodyFat}%</td>
                  </tr>
                </table>
              </div>
            </div>
            
            <div class="chart-container">
              <div class="chart-box">
                <h2>2. Body Composition</h2>
                <figure>
                  <canvas id="bodyCompositionChart" width="300" height="300"></canvas>
                  <figcaption>Body Composition</figcaption>
                </figure>
                <div class="interpretation">
                  <p><strong>Fat Mass:</strong> ${fatMass} kg</p>
                  <p><strong>Lean Mass:</strong> ${leanMass} kg</p>
                  <p>This chart shows your proportion of fat vs. lean tissue.</p>
                </div>
              </div>
              
              <div class="chart-box">
                <h2>3. Anthropometric vs. Ideal</h2>
                <figure>
                  <canvas id="anthropometricChart" width="400" height="300"></canvas>
                  <figcaption>Anthropometric Metrics vs. Ideal</figcaption>
                </figure>
                <div class="interpretation">
                  <p>This chart compares your current metrics to ideal reference values:</p>
                  <ul>
                    <li>BMI compared to normal mid-point (22 kg/m²)</li>
                    <li>Current weight compared to Ideal Body Weight</li>
                    <li>BSA compared to average (1.7 m² for adults)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <button class="download-btn" onclick="downloadPDF('Anthropometrics-Report')">Download as PDF</button>
        </div>
        
        <script>
          ${pdfConfig}
          
          // Wait for charts to be created
          window.onload = function() {
            try {
              // Body Composition Pie Chart
              const bodyCompositionCtx = document.getElementById('bodyCompositionChart').getContext('2d');
              new Chart(bodyCompositionCtx, {
                type: 'pie',
                data: {
                  labels: ['Fat Mass', 'Lean Mass'],
                  datasets: [{
                    data: [${fatMass}, ${leanMass}],
                    backgroundColor: ['#ff6b6b', '#4ecdc4'],
                    borderWidth: 1
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    }
                  }
                }
              });
              
              // Anthropometric vs. Ideal Bar Chart
              const anthropometricCtx = document.getElementById('anthropometricChart').getContext('2d');
              new Chart(anthropometricCtx, {
                type: 'bar',
                data: {
                  labels: ['BMI (kg/m²)', 'Weight (kg)', 'BSA (m²)'],
                  datasets: [
                    {
                      label: 'Your Metrics',
                      data: [${bmi}, ${weightKg}, ${bsa}],
                      backgroundColor: '#3498db'
                    },
                    {
                      label: 'Reference Values',
                      data: [22, ${ibw}, 1.7],
                      backgroundColor: '#2ecc71'
                    }
                  ]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: true,
                  scales: {
                    y: {
                      beginAtZero: false
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }
              });
            } catch (err) {
              console.error('Error creating charts:', err);
              alert('There was an error creating the charts. Please try again.');
            }
          };
        </script>
      </body>
      </html>
    `;
    
    // Create Energy Expenditure Report Tab (Report B)
    const energyReportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Energy Expenditure Report</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          html {
            zoom: 1;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          html, body { 
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            background-color: white;
          }
          body { 
            font-family: Arial, sans-serif; 
            padding: 20mm; 
            line-height: 1.6;
            box-sizing: border-box;
            color: black;
          }
          h1, h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          .report-header { margin-bottom: 30px; }
          .date { color: #7f8c8d; margin-top: 10px; font-style: italic; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11pt; }
          th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f8f9fa; }
          .chart-container { 
            display: flex; 
            flex-direction: column;
            margin: 20px 0;
            page-break-inside: avoid;
          }
          .chart-box { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 8px; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            width: 100%;
            margin-bottom: 20px;
            box-sizing: border-box;
            page-break-inside: avoid;
          }
          .chart-box h3 { margin-top: 0; color: #3498db; }
          .metrics-row { margin-bottom: 20px; page-break-inside: avoid; }
          .metrics-container { width: 100%; }
          .interpretation { background: #f0f9e8; padding: 10px; border-radius: 8px; margin: 15px 0; font-size: 10pt; }
          .recommendations { background: #f0f9e8; padding: 15px; border-radius: 8px; margin: 20px 0; page-break-inside: avoid; }
          canvas { margin: 10px auto; max-height: 200px; width: auto !important; height: auto !important; }
          figure { margin: 15px 0; text-align: center; }
          figcaption { margin-top: 5px; font-weight: bold; color: #555; font-size: 10pt; }
          .download-btn {
            background-color: #27ae60;
            color: white;
            border: none;
            padding: 12px 20px;
            font-size: 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 20px;
            display: inline-block;
          }
          .download-btn:hover {
            background-color: #219653;
          }
          @media print {
            .download-btn {
              display: none;
            }
            body {
              width: 100%;
              height: auto;
            }
            .chart-box {
              width: 100%;
              break-inside: avoid;
            }
            h1, h2, h3 {
              break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div id="report-content">
          <div class="report-header">
            <h1>Energy Expenditure Report</h1>
            <div class="date">Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          </div>
          
          <div class="metrics-row">
            <div class="metrics-container">
              <h2>1. Inputs & Outputs Table</h2>
              <table>
                <tr>
                  <th>Input</th>
                  <th>Value</th>
                  <th>Output Metric</th>
                  <th>Value</th>
                </tr>
                <tr>
                  <td>Weight (kg)</td>
                  <td>${weightKg}</td>
                  <td>BMR</td>
                  <td>${bmr.toLocaleString()} kcal/day</td>
                </tr>
                <tr>
                  <td>Height (cm)</td>
                  <td>${heightCm}</td>
                  <td>TDEE</td>
                  <td>${tdee.toLocaleString()} kcal/day</td>
                </tr>
                <tr>
                  <td>Age (years)</td>
                  <td>${formData.age}</td>
                  <td>Activity Level</td>
                  <td>${activityMultiplier}</td>
                </tr>
              </table>
            </div>
          </div>
          
          <div class="chart-container">
            <div class="chart-box">
              <h2>2. BMR vs. Activity Calories</h2>
              <figure>
                <canvas id="energyBreakdownChart" width="300" height="300"></canvas>
                <figcaption>Energy Expenditure Breakdown</figcaption>
              </figure>
              <div class="interpretation">
                <p><strong>Baseline (BMR):</strong> ${bmr.toLocaleString()} kcal/day</p>
                <p><strong>Activity:</strong> ${activityCalories.toLocaleString()} kcal/day</p>
                <p>This chart shows how much of your daily energy needs come from basic metabolism versus activity.</p>
              </div>
            </div>
            
            <div class="chart-box">
              <h2>3. BMR & TDEE Side-by-Side</h2>
              <figure>
                <canvas id="bmrTdeeChart" width="400" height="300"></canvas>
                <figcaption>BMR vs. TDEE</figcaption>
              </figure>
              <div class="interpretation">
                <p>This chart highlights the difference between:</p>
                <ul>
                  <li><strong>BMR:</strong> Basal Metabolic Rate - calories needed at complete rest</li>
                  <li><strong>TDEE:</strong> Total Daily Energy Expenditure - includes all activity</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="recommendations">
            <h2>Daily Calorie Goals</h2>
            
            <table>
              <tr>
                <th>Goal</th>
                <th>Daily Calories</th>
                <th>Notes</th>
              </tr>
              <tr>
                <td>Weight Maintenance</td>
                <td>${tdee.toLocaleString()} kcal</td>
                <td>To maintain your current weight</td>
              </tr>
              <tr>
                <td>Moderate Weight Loss</td>
                <td>${Math.round(tdee - 500).toLocaleString()} kcal</td>
                <td>For approximately 0.5kg (1lb) loss per week</td>
              </tr>
              <tr>
                <td>Moderate Weight Gain</td>
                <td>${Math.round(tdee + 500).toLocaleString()} kcal</td>
                <td>For approximately 0.5kg (1lb) gain per week</td>
              </tr>
            </table>
            
            <p><strong>Note:</strong> These are estimates based on calculated formulas. Individual requirements may vary.</p>
          </div>
        </div>
        
        <button class="download-btn" onclick="downloadPDF('Energy-Expenditure-Report')">Download as PDF</button>
        
        <script>
          ${pdfConfig}
          
          // Wait for charts to be created
          window.onload = function() {
            try {
              // Energy Breakdown Pie Chart
              const energyBreakdownCtx = document.getElementById('energyBreakdownChart').getContext('2d');
              new Chart(energyBreakdownCtx, {
                type: 'pie',
                data: {
                  labels: ['Baseline (BMR)', 'Activity'],
                  datasets: [{
                    data: [${bmr}, ${activityCalories}],
                    backgroundColor: ['#3498db', '#f39c12'],
                    borderWidth: 1
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    }
                  }
                }
              });
              
              // BMR vs TDEE Bar Chart
              const bmrTdeeCtx = document.getElementById('bmrTdeeChart').getContext('2d');
              new Chart(bmrTdeeCtx, {
                type: 'bar',
                data: {
                  labels: ['Energy Needs'],
                  datasets: [
                    {
                      label: 'BMR',
                      data: [${bmr}],
                      backgroundColor: '#3498db'
                    },
                    {
                      label: 'TDEE',
                      data: [${tdee}],
                      backgroundColor: '#f39c12'
                    }
                  ]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Calories per Day'
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }
              });
            } catch (err) {
              console.error('Error creating charts:', err);
              alert('There was an error creating the charts. Please try again.');
            }
          };
        </script>
      </body>
      </html>
    `;
    
    // Open report tabs in new windows
    const anthropometricsTab = window.open('', '_blank');
    if (anthropometricsTab) {
      anthropometricsTab.document.write(anthropometricsReportContent);
      anthropometricsTab.document.close();
    } else {
      console.error('Failed to open Anthropometrics Report Tab');
    }

    const energyExpenditureTab = window.open('', '_blank');
    if (energyExpenditureTab) {
      energyExpenditureTab.document.write(energyReportContent);
      energyExpenditureTab.document.close();
    } else {
      console.error('Failed to open Energy Expenditure Report Tab');
    }
  };
  // Function to download combined PDF report
  const downloadCombinedReport = async () => {
    setGeneratingPdf(true);
    
    try {
      // Calculate all metrics needed for the report
      const weightKg = parseInt(formData.weight);
      const heightCm = parseInt(formData.height);
      const heightM = heightCm / 100;
      const bmi = parseFloat(metrics.bmi);
      const bodyFat = parseFloat(metrics.bodyFat);
      const bmr = parseInt(metrics.bmr);
      const tdee = parseInt(metrics.tdee);
      
      // Calculate additional metrics
      const bsa = Math.sqrt((weightKg * heightCm) / 3600).toFixed(2);
      let ibw;
      if (formData.sex === 'male') {
        ibw = (50 + 2.3 * ((heightCm / 2.54) - 60)).toFixed(1);
      } else {
        ibw = (45.5 + 2.3 * ((heightCm / 2.54) - 60)).toFixed(1);
      }
      const fatMass = (weightKg * (bodyFat / 100)).toFixed(1);
      const leanMass = (weightKg - fatMass).toFixed(1);
      const activityCalories = tdee - bmr;
      
      // Get activity multiplier text
      let activityMultiplier;
      switch(formData.activityLevel) {
        case 'sedentary': activityMultiplier = "Sedentary (× 1.2)"; break;
        case 'lightly': activityMultiplier = "Lightly active (× 1.375)"; break;
        case 'moderately': activityMultiplier = "Moderately active (× 1.55)"; break;
        case 'very': activityMultiplier = "Very active (× 1.725)"; break;
        case 'extra': activityMultiplier = "Extra active (× 1.9)"; break;
        default: activityMultiplier = "Not specified";
      }
      
      // Create a new window for the complete report
      const reportWindow = window.open('', '_blank');
      
      // PDF generation options for better A4 formatting
      const pdfConfig = `
        function downloadPDF(filename) {
          const element = document.getElementById('report-content');
          const opt = {
            margin: [15, 15, 15, 15],
            filename: filename + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
              scale: 2,
              useCORS: true,
              letterRendering: true,
              scrollX: 0,
              scrollY: 0,
              windowWidth: 794, // A4 width in pixels at 96 DPI
              windowHeight: 1123 // A4 height in pixels at 96 DPI
            },
            jsPDF: { 
              unit: 'mm', 
              format: 'a4', 
              orientation: 'portrait',
              compress: true,
              hotfixes: ["px_scaling"]
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
          };
          
          // Show loading indicator
          const loadingMessage = document.createElement('div');
          loadingMessage.innerText = 'Generating PDF, please wait...';
          loadingMessage.style.position = 'fixed';
          loadingMessage.style.top = '50%';
          loadingMessage.style.left = '50%';
          loadingMessage.style.transform = 'translate(-50%, -50%)';
          loadingMessage.style.background = 'rgba(0,0,0,0.7)';
          loadingMessage.style.color = 'white';
          loadingMessage.style.padding = '20px';
          loadingMessage.style.borderRadius = '10px';
          loadingMessage.style.zIndex = '9999';
          document.body.appendChild(loadingMessage);
          
          // Generate PDF
          html2pdf()
            .set(opt)
            .from(element)
            .save()
            .then(() => {
              document.body.removeChild(loadingMessage);
            })
            .catch(err => {
              console.error('Error generating PDF:', err);
              document.body.removeChild(loadingMessage);
              alert('There was an error generating the PDF. Please try again.');
            });
        }
      `;
      
      // Create a complete report that can be downloaded
      const completeReportContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Complete Health Metrics Report</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            html {
              zoom: 1;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            html, body { 
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
              background-color: white;
            }
            body { 
              font-family: Arial, sans-serif;
              padding: 20mm; 
              line-height: 1.6;
              box-sizing: border-box;
              color: black;
            }
            h1, h2, h3 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; break-after: avoid; }
            .report-header { margin-bottom: 30px; }
            .date { color: #7f8c8d; margin-top: 10px; font-style: italic; }
            .patient-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; }
            .chart-container { 
              display: flex; 
              flex-direction: column;
              margin: 20px 0;
              page-break-inside: avoid;
            }
            .chart-box { 
              background: #f8f9fa; 
              padding: 15px; 
              border-radius: 8px; 
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
              width: 100%;
              margin-bottom: 20px;
              box-sizing: border-box;
              page-break-inside: avoid;
            }
            .interpretation { background: #e8f4f8; padding: 10px; border-radius: 8px; margin: 15px 0; font-size: 10pt; }
            .recommendations { background: #f0f9e8; padding: 15px; border-radius: 8px; margin: 20px 0; page-break-inside: avoid; }
            canvas { margin: 10px auto; max-height: 200px; width: auto !important; height: auto !important; }
            figure { margin: 15px 0; text-align: center; }
            figcaption { margin-top: 5px; font-weight: bold; color: #555; font-size: 10pt; }
            .section { margin-top: 40px; page-break-before: always; }
            .first-section { page-break-before: avoid !important; }
            .download-btn {
              background-color: #27ae60;
              color: white;
              border: none;
              padding: 12px 20px;
              font-size: 16px;
              border-radius: 4px;
              cursor: pointer;
              margin-top: 20px;
              display: inline-block;
            }
            .download-btn:hover {
              background-color: #219653;
            }
            @media print {
              .download-btn {
                display: none;
              }
              body {
                width: 100%;
                height: auto;
                padding: 15mm;
              }
              .section {
                page-break-before: always;
              }
              h1, h2, h3 {
                break-after: avoid;
              }
              table {
                page-break-inside: avoid;
              }
              .chart-box {
                break-inside: avoid;
                page-break-inside: avoid;
                width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div id="report-content">
            <div class="report-header">
              <h1>Complete Health Metrics Report</h1>
              <div class="date">Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
            </div>
            
            <div class="patient-info">
              <h3>Patient Data</h3>
              <table>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
                <tr>
                  <td>Weight</td>
                  <td>${weightKg} kg</td>
                </tr>
                <tr>
                  <td>Height</td>
                  <td>${heightCm} cm</td>
                </tr>
                <tr>
                  <td>Age</td>
                  <td>${formData.age} years</td>
                </tr>
                <tr>
                  <td>Sex</td>
                  <td>${formData.sex.charAt(0).toUpperCase() + formData.sex.slice(1)}</td>
                </tr>
                <tr>
                  <td>Activity Level</td>
                  <td>${activityMultiplier}</td>
                </tr>
              </table>
            </div>
            
            <div class="section first-section">
              <h2>Part I: Anthropometrics Report</h2>
              
              <table>
                <tr>
                  <th>Output Metric</th>
                  <th>Value</th>
                  <th>Description</th>
                </tr>
                <tr>
                  <td>BMI</td>
                  <td>${bmi} kg/m²</td>
                  <td>Body Mass Index - a measure of weight relative to height</td>
                </tr>
                <tr>
                  <td>BSA</td>
                  <td>${bsa} m²</td>
                  <td>Body Surface Area - useful for medication dosing</td>
                </tr>
                <tr>
                  <td>Ideal Weight</td>
                  <td>${ibw} kg</td>
                  <td>Calculated using the Devine formula</td>
                </tr>
                <tr>
                  <td>Body Fat %</td>
                  <td>${bodyFat}%</td>
                  <td>Estimated using BMI-based formula</td>
                </tr>
              </table>
              
              <div class="chart-container">
                <div class="chart-box">
                  <h3>Body Composition</h3>
                  <figure>
                    <canvas id="bodyCompositionChart" width="300" height="300"></canvas>
                    <figcaption>Body Composition</figcaption>
                  </figure>
                  <div class="interpretation">
                    <p><strong>Fat Mass:</strong> ${fatMass} kg</p>
                    <p><strong>Lean Mass:</strong> ${leanMass} kg</p>
                    <p>This chart shows your proportion of fat vs. lean tissue.</p>
                  </div>
                </div>
                
                <div class="chart-box">
                  <h3>Anthropometric vs. Ideal</h3>
                  <figure>
                    <canvas id="anthropometricChart" width="400" height="300"></canvas>
                    <figcaption>Anthropometric Metrics vs. Ideal</figcaption>
                  </figure>
                  <div class="interpretation">
                    <p>This chart compares your current metrics to ideal reference values.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>Part II: Energy Expenditure Report</h2>
              
              <table>
                <tr>
                  <th>Output Metric</th>
                  <th>Value</th>
                  <th>Description</th>
                </tr>
                <tr>
                  <td>BMR</td>
                  <td>${bmr.toLocaleString()} kcal/day</td>
                  <td>Basal Metabolic Rate - energy needed at complete rest</td>
                </tr>
                <tr>
                  <td>TDEE</td>
                  <td>${tdee.toLocaleString()} kcal/day</td>
                  <td>Total Daily Energy Expenditure - includes activity</td>
                </tr>
                <tr>
                  <td>Activity Calories</td>
                  <td>${activityCalories.toLocaleString()} kcal/day</td>
                  <td>Additional calories used for daily activities</td>
                </tr>
              </table>
              
              <div class="chart-container">
                <div class="chart-box">
                  <h3>BMR vs. Activity Calories</h3>
                  <figure>
                    <canvas id="energyBreakdownChart" width="300" height="300"></canvas>
                    <figcaption>Energy Expenditure Breakdown</figcaption>
                  </figure>
                  <div class="interpretation">
                    <p>This chart shows how much of your daily energy needs come from basic metabolism versus activity.</p>
                  </div>
                </div>
                
                <div class="chart-box">
                  <h3>BMR & TDEE Side-by-Side</h3>
                  <figure>
                    <canvas id="bmrTdeeChart" width="400" height="300"></canvas>
                    <figcaption>BMR vs. TDEE</figcaption>
                  </figure>
                  <div class="interpretation">
                    <p>This chart highlights the difference between your basal metabolic rate and total daily energy expenditure.</p>
                  </div>
                </div>
              </div>
              
              <div class="recommendations">
                <h3>Daily Calorie Goals</h3>
                
                <table>
                  <tr>
                    <th>Goal</th>
                    <th>Daily Calories</th>
                    <th>Notes</th>
                  </tr>
                  <tr>
                    <td>Weight Maintenance</td>
                    <td>${tdee.toLocaleString()} kcal</td>
                    <td>To maintain your current weight</td>
                  </tr>
                  <tr>
                    <td>Moderate Weight Loss</td>
                    <td>${Math.round(tdee - 500).toLocaleString()} kcal</td>
                    <td>For approximately 0.5kg (1lb) loss per week</td>
                  </tr>
                  <tr>
                    <td>Moderate Weight Gain</td>
                    <td>${Math.round(tdee + 500).toLocaleString()} kcal</td>
                    <td>For approximately 0.5kg (1lb) gain per week</td>
                  </tr>
                </table>
                
                <p><strong>Note:</strong> These are estimates based on calculated formulas. Individual requirements may vary. Consult with a healthcare professional before making significant changes to your diet or exercise routine.</p>
              </div>
            </div>
          </div>
          
          <button class="download-btn" onclick="downloadPDF('Complete-Health-Metrics-Report')">Download as PDF</button>
          
          <script>
            ${pdfConfig}
            
            // Wait for charts to be created
            window.onload = function() {
              try {
                // Body Composition Pie Chart
                const bodyCompositionCtx = document.getElementById('bodyCompositionChart').getContext('2d');
                new Chart(bodyCompositionCtx, {
                  type: 'pie',
                  data: {
                    labels: ['Fat Mass', 'Lean Mass'],
                    datasets: [{
                      data: [${fatMass}, ${leanMass}],
                      backgroundColor: ['#ff6b6b', '#4ecdc4'],
                      borderWidth: 1
                    }]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      }
                    }
                  }
                });
                
                // Anthropometric vs. Ideal Bar Chart
                const anthropometricCtx = document.getElementById('anthropometricChart').getContext('2d');
                new Chart(anthropometricCtx, {
                  type: 'bar',
                  data: {
                    labels: ['BMI (kg/m²)', 'Weight (kg)', 'BSA (m²)'],
                    datasets: [
                      {
                        label: 'Your Metrics',
                        data: [${bmi}, ${weightKg}, ${bsa}],
                        backgroundColor: '#3498db'
                      },
                      {
                        label: 'Reference Values',
                        data: [22, ${ibw}, 1.7],
                        backgroundColor: '#2ecc71'
                      }
                    ]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                      y: {
                        beginAtZero: false
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }
                });
                
                // Energy Breakdown Pie Chart
                const energyBreakdownCtx = document.getElementById('energyBreakdownChart').getContext('2d');
                new Chart(energyBreakdownCtx, {
                  type: 'pie',
                  data: {
                    labels: ['Baseline (BMR)', 'Activity'],
                    datasets: [{
                      data: [${bmr}, ${activityCalories}],
                      backgroundColor: ['#3498db', '#f39c12'],
                      borderWidth: 1
                    }]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      }
                    }
                  }
                });
                
                // BMR vs TDEE Bar Chart
                const bmrTdeeCtx = document.getElementById('bmrTdeeChart').getContext('2d');
                new Chart(bmrTdeeCtx, {
                  type: 'bar',
                  data: {
                    labels: ['Energy Needs'],
                    datasets: [
                      {
                        label: 'BMR',
                        data: [${bmr}],
                        backgroundColor: '#3498db'
                      },
                      {
                        label: 'TDEE',
                        data: [${tdee}],
                        backgroundColor: '#f39c12'
                      }
                    ]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Calories per Day'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }
                });
              } catch (err) {
                console.error('Error creating charts:', err);
                alert('There was an error creating the charts. Please try again.');
              }
            };
          </script>
        </body>
        </html>
      `;
      
      reportWindow.document.write(completeReportContent);
      reportWindow.document.close();
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF report. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return <div className="loading">Generating your health report...</div>;
  }
  
  return (
    <div className="generate-reports">
      <h2>Generate Health Metrics Report</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="report-container">
        {!showResults ? (
          <form className="metrics-form" onSubmit={generateReport}>            <div className="form-group">
              <label htmlFor="weight">Weight (kg):</label>
              <input 
                type="text" 
                id="weight"
                name="weight" 
                value={formData.weight}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow whole numbers up to 200
                  if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 200)) {
                    handleChange(e);
                  }
                }}
                placeholder="Enter weight in kilograms"
                maxLength={3}
              />
              <small className="input-hint">Enter a whole number between 1-200</small>
            </div>

            <div className="form-group">
              <label htmlFor="height">Height (cm):</label>
              <input 
                type="text" 
                id="height"
                name="height" 
                value={formData.height}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow whole numbers up to 250
                  if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 250)) {
                    handleChange(e);
                  }
                }}
                placeholder="Enter height in centimeters"
                maxLength={3}
              />
              <small className="input-hint">Enter a whole number between 1-250</small>
            </div>

            <div className="form-group">
              <label htmlFor="age">Age (years):</label>
              <input 
                type="text" 
                id="age"
                name="age" 
                value={formData.age}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow whole numbers up to 100
                  if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 100)) {
                    handleChange(e);
                  }
                }}
                placeholder="Enter age in years"
                maxLength={3}
              />
              <small className="input-hint">Enter a whole number between 1-100</small>
            </div>

            <div className="form-group">
              <label htmlFor="sex">Sex:</label>
              <select 
                id="sex"
                name="sex" 
                value={formData.sex}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="activityLevel">Activity Level:</label>
              <select 
                id="activityLevel"
                name="activityLevel" 
                value={formData.activityLevel}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="sedentary">Sedentary (little or no exercise)</option>
                <option value="lightly">Lightly active (1–3 days/week)</option>
                <option value="moderately">Moderately active (3–5 days/week)</option>
                <option value="very">Very active (6–7 days/week)</option>
                <option value="extra">Extra active (hard exercise or physical job)</option>
              </select>
            </div>

            <button 
              className="generate-btn" 
              type="submit"
              disabled={loading}
            >
              Generate Report
            </button>
          </form>
        ) : (
          <div className="report-results">
            <h3>Your Health Metrics Report</h3>
            
            <div className="metric-card">
              <h4>Body Mass Index (BMI)</h4>
              <div className="metric-value">{metrics.bmi}</div>
              <div className="metric-description">
                BMI is a measure of body fat based on height and weight.
              </div>
            </div>
            
            <div className="metric-card">
              <h4>Basal Metabolic Rate (BMR)</h4>
              <div className="metric-value">{metrics.bmr} calories/day</div>
              <div className="metric-description">
                BMR is the number of calories your body needs at rest.
              </div>
            </div>
            
            <div className="metric-card">
              <h4>Total Daily Energy Expenditure (TDEE)</h4>
              <div className="metric-value">{metrics.tdee} calories/day</div>
              <div className="metric-description">
                TDEE is your total calorie burn per day including activity.
              </div>
            </div>
            
            <div className="metric-card">
              <h4>Ideal Weight Range</h4>
              <div className="metric-value">{metrics.idealWeight}</div>
              <div className="metric-description">
                Based on a healthy BMI range of 18.5-24.9.
              </div>
            </div>
            
            <div className="metric-card">
              <h4>Estimated Body Fat Percentage</h4>
              <div className="metric-value">{metrics.bodyFat}%</div>
              <div className="metric-description">
                An estimate of your body fat percentage based on BMI.
              </div>
            </div>
              <div className="report-actions">
              <button 
                className="back-btn"
                onClick={() => setShowResults(false)}
              >
                Generate Another Report
              </button>
              
              {reportGenerated && (
                <>
                  <button 
                    className="view-reports-btn"
                    onClick={() => openReportTabs(metrics)}
                  >
                    View Detailed Reports
                  </button>
                  
                  <button 
                    className="view-reports-btn"
                    onClick={downloadCombinedReport}
                    disabled={generatingPdf}
                    style={{ backgroundColor: '#8e44ad' }}
                  >
                    {generatingPdf ? 'Generating PDF...' : 'Download Complete Report'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
