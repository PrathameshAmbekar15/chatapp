import React, { useState } from 'react';
import LeftSidebar from '../../components/LeftSidebar/LeftSidebar';
import ChatBox from '../../components/ChatBox/ChatBox';
import RightSidebar from '../../components/RightSidebar/RightSidebar';
import './Chat.css'; // Create this CSS file

const Chat = () => {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // Toggle functions for mobile
  const toggleLeftSidebar = () => {
    setLeftSidebarOpen(!leftSidebarOpen);
    if (rightSidebarOpen) setRightSidebarOpen(false); // Close right sidebar
  };

  const toggleRightSidebar = () => {
    setRightSidebarOpen(!rightSidebarOpen);
    if (leftSidebarOpen) setLeftSidebarOpen(false); // Close left sidebar
  };

  const closeSidebars = () => {
    setLeftSidebarOpen(false);
    setRightSidebarOpen(false);
  };

  return (
    <div className="chat-container">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          className="sidebar-toggle left-toggle" 
          onClick={toggleLeftSidebar}
          aria-label="Toggle contacts"
        >
          <span className="toggle-icon">☰</span>
        </button>
        
        <div className="mobile-title">
          ChatApp
        </div>
        
        <button 
          className="sidebar-toggle right-toggle" 
          onClick={toggleRightSidebar}
          aria-label="Toggle profile"
        >
          <span className="toggle-icon">⚙️</span>
        </button>
      </div>

      {/* Sidebar Overlay for mobile */}
      {(leftSidebarOpen || rightSidebarOpen) && (
        <div className="sidebar-overlay" onClick={closeSidebars}></div>
      )}

      {/* Main Layout */}
      <div className="main-layout">
        {/* Left Sidebar */}
        <div className={`left-sidebar ${leftSidebarOpen ? 'active' : ''}`}>
          <LeftSidebar />
        </div>

        {/* Chat Box - Always visible */}
        <div className="chat-main">
          <ChatBox />
        </div>

        {/* Right Sidebar */}
        <div className={`right-sidebar ${rightSidebarOpen ? 'active' : ''}`}>
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};

export default Chat;