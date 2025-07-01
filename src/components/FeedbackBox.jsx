import React, { useState } from 'react';

/**
 * FeedbackBox - Component for submitting feedback
 * @param {Object} props - Component props
 * @param {Function} props.onSubmit - Function called when feedback is submitted
 * @param {string} [props.placeholder="Enter your feedback..."] - Placeholder text for the feedback textarea
 * @param {string} [props.buttonText="Submit Feedback"] - Text for the submit button
 */
const FeedbackBox = ({ onSubmit, placeholder = "Enter your feedback...", buttonText = "Submit Feedback" }) => {
  const [feedbackText, setFeedbackText] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (feedbackText.trim()) {
      onSubmit(feedbackText);
      setFeedbackText('');
    }
  };
  
  return (
    <div className="feedback-box">
      <form onSubmit={handleSubmit}>
        <textarea 
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="feedback-textarea"
        />
        <button 
          type="submit" 
          className="feedback-submit-btn"
          disabled={!feedbackText.trim()}
        >
          {buttonText}
        </button>
      </form>
    </div>
  );
};

export default FeedbackBox;