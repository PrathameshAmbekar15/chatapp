import React, { useContext, useEffect, useState } from 'react'
import './RightSidebar.css'
import assets from '../../assets/assets'
import { logout } from '../../config/firebase'
import { AppContext } from '../../context/AppContext'
import { db } from '../../config/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

const RightSidebar = () => {
  const { userData, selectedChat } = useContext(AppContext)
  const [chatImages, setChatImages] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch images from current chat only when a chat is selected
  useEffect(() => {
    if (!selectedChat?.messageId) {
      setChatImages([])
      setLoading(false)
      return
    }

    setLoading(true)
    const messagesRef = doc(db, "messages", selectedChat.messageId)
    const unsubscribe = onSnapshot(messagesRef, (snap) => {
      if (snap.exists()) {
        const messages = snap.data().messages || []
        // Filter messages that have images and get unique images
        const images = messages
          .filter(msg => msg.image && msg.image.trim() !== '')
          .map(msg => ({
            url: msg.image,
            timestamp: msg.timestamp,
            senderId: msg.senderId
          }))
          // Remove duplicates (same image URL)
          .filter((image, index, self) => 
            index === self.findIndex(i => i.url === image.url)
          )
          // Sort by timestamp (newest first)
          .sort((a, b) => b.timestamp - a.timestamp)
        
        setChatImages(images)
      } else {
        setChatImages([])
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [selectedChat])

  // Format timestamp for display
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      .replace(' AM', ' am')
      .replace(' PM', ' pm')
  }

  // When NO chat is selected (After login) - Show SIMPLE interface
  if (!selectedChat) {
    return (
      <div className='rs'>
        {/* User Profile Section - Simple Version */}
        <div className="rs-profile-simple">
          <img 
            src={userData?.avatar || assets.profile_img} 
            alt="Profile" 
            className="profile-image-simple"
          />
          <div className="profile-info-simple">
            <h3 className="profile-name-simple">
              {userData?.name || userData?.username || 'User'}
            </h3>
            <p className="profile-status-simple">
              {userData?.status || 'Hey there, I am using chat app'}
            </p>
          </div>
        </div>

        <div className="divider"></div>

        {/* Simple Info Section */}
        <div className="simple-info">
          <div className="info-item">
            <span className="info-icon">💬</span>
            <div className="info-content">
              <h4>Start Messaging</h4>
              <p>Select a contact to begin chatting</p>
            </div>
          </div>
          
          
          <div className="info-item">
            <span className="info-icon">📷</span>
            <div className="info-content">
              <h4>Share Media</h4>
              <p>Send photos, videos and documents</p>
            </div>
          </div>
        </div>

        <div className="divider"></div>

        {/* Logout Button */}
        <div className="logout-section">
          <button 
            className="logout-btn"
            onClick={() => logout()}
          >
            <span className="logout-icon">🚪</span>
            Logout
          </button>
        </div>
      </div>
    )
  }

  // When a chat IS selected - Show ORIGINAL interface with media
  return (
    <div className='rs'>
      {/* User Profile Section */}
      <div className="rs-profile">
        <img 
          src={userData?.avatar || assets.profile_img} 
          alt="Profile" 
          className="profile-image"
        />
        <div className="profile-info">
          <h3 className="profile-name">
            {userData?.name || userData?.username || 'User'}
            <span className="online-status">online</span>
          </h3>
          <p className="profile-status">
            {userData?.status || 'Hey there, I am using chat app'}
          </p>
        </div>
      </div>

      <div className="divider"></div>

      {/* Media Section - ORIGINAL */}
      <div className="rs-media">
        <div className="media-header">
          <h4>Media, Links and Docs</h4>
          <span className="media-count">{chatImages.length}</span>
        </div>
        
        {loading ? (
          <div className="loading-media">
            <div className="loading-spinner"></div>
            <p>Loading media...</p>
          </div>
        ) : chatImages.length === 0 ? (
          <div className="no-media">
            <div className="no-media-icon">📷</div>
            <p>No media shared yet</p>
          </div>
        ) : (
          <>
            <div className="media-grid">
              {chatImages.slice(0, 8).map((image, index) => (
                <div key={index} className="media-item">
                  <img 
                    src={image.url} 
                    alt={`Shared content ${index + 1}`} 
                    className="media-image"
                    loading="lazy"
                  />
                  {image.timestamp && (
                    <div className="media-time">{formatTime(image.timestamp)}</div>
                  )}
                </div>
              ))}
            </div>
            
            {chatImages.length > 8 && (
              <div className="view-more">
                <button className="view-more-btn">
                  View {chatImages.length - 8} more
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="divider"></div>

      {/* Logout Button */}
      <div className="logout-section">
        <button 
          className="logout-btn"
          onClick={() => logout()}
        >
          <span className="logout-icon">🚪</span>
          Logout
        </button>
      </div>
    </div>
  )
}

export default RightSidebar