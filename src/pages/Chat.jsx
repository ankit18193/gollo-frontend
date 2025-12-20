import React, { useState, useRef, useEffect } from 'react';
import '../index.css';
import {
    Send, Plus, MessageSquare, Menu, User, Bot, Trash,
    Pin, Edit3, X, LogOut, MoreVertical, Share2
} from 'lucide-react';
import { useAuth } from "../context/AuthContext.jsx";


import {
    sendChatMessage,
    getUserChats,
    deleteChatApi,
    renameChatApi,
    pinChatApi
} from "../api/chat.api.js";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Chat = () => {
    const { logout, user } = useAuth();

    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [dbChatId, setDbChatId] = useState(null);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    
    const [systemError, setSystemError] = useState(null);
    const [inputLocked, setInputLocked] = useState(false);

    const [editingChatId, setEditingChatId] = useState(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [showProfileModal, setShowProfileModal] = useState(false);


    const [menuOpenId, setMenuOpenId] = useState(null);
    const [hoveredChatId, setHoveredChatId] = useState(null);

    const activeChat = chats.find(chat => chat.id === activeChatId);
    const messagesEndRef = useRef(null);


    useEffect(() => {
        const loadChatsFromDB = async () => {
            try {

                const res = await getUserChats();

                if (res?.data?.success) {
                    const dbChats = res.data.chats.map(chat => ({
                        id: chat._id,
                        title: chat.title,
                        messages: chat.messages,
                        pinned: chat.pinned || false,
                        isCustomTitle: true,
                    }));

                    setChats(dbChats);


                    const savedActiveChatId = localStorage.getItem("gollo_active_chat");

                    if (savedActiveChatId && dbChats.some(c => c.id === savedActiveChatId)) {
                        setActiveChatId(savedActiveChatId);
                    } else if (dbChats.length > 0) {
                        setActiveChatId(dbChats[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to load chats from DB:", err);
            } finally {

            }
        };

        loadChatsFromDB();
    }, []);


    useEffect(() => {
        localStorage.setItem("gollo_chats", JSON.stringify(chats));
    }, [chats]);

    useEffect(() => {
        if (activeChatId) localStorage.setItem("gollo_active_chat", activeChatId);
    }, [activeChatId]);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuOpenId && !event.target.closest('.chat-menu-popup') && !event.target.closest('.dots-trigger-btn')) {
                setMenuOpenId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpenId]);

    useEffect(() => {
        if (systemError) {
            const timer = setTimeout(() => setSystemError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [systemError]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChat?.messages, loading]);


    const filteredChats = chats.filter(chat =>
        (chat.title || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const createNewChat = () => {
        const newChat = {
            id: Date.now(),
            title: "New Chat",
            messages: [],
            pinned: false,
            isCustomTitle: false,
        };
        setChats(prev => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        setDbChatId(null);
        localStorage.removeItem("gollo_db_chat_id");
        setInput("");
        setInputLocked(false);
        setSystemError(null);
        if (window.innerWidth < 768) setSidebarOpen(false);
        return newChat.id;
    };


    const deleteChat = async (chatId, e) => {
        if (e) e.stopPropagation();


        const updatedChats = chats.filter(chat => chat.id !== chatId);
        setChats(updatedChats);

        if (chatId === activeChatId) {
            setActiveChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
        }
        setMenuOpenId(null);


        try {
            await deleteChatApi(chatId);
        } catch (error) {
            console.error("Failed to delete chat:", error);
            alert("Could not delete chat from server.");
        }
    };


    const togglePinChat = async (chatId, e) => {
        if (e) e.stopPropagation();

        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;

        const newPinnedStatus = !chat.pinned;


        setChats(prev => prev.map(c => c.id === chatId ? { ...c, pinned: newPinnedStatus } : c));
        setMenuOpenId(null);


        try {
            await pinChatApi(chatId, newPinnedStatus);
        } catch (error) {
            console.error("Failed to pin chat:", error);

            setChats(prev => prev.map(c => c.id === chatId ? { ...c, pinned: !newPinnedStatus } : c));
        }
    };

    const startRename = (chat, e) => {
        if (e) e.stopPropagation();
        setEditingChatId(chat.id);
        setEditingTitle(chat.title);
        setMenuOpenId(null);
    };

    const handleShare = (chatId, e) => {
        if (e) e.stopPropagation();
        alert(`Link copied for chat ${chatId}`);
        setMenuOpenId(null);
    };


    const saveRename = async (chatId) => {
        const newTitle = editingTitle.trim() || "New Chat";


        setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle, isCustomTitle: true } : c));
        setEditingChatId(null);


        try {
            await renameChatApi(chatId, newTitle);
        } catch (error) {
            console.error("Failed to rename chat:", error);
        }
    };

    const typeMessage = (fullText, chatId) => {
        let index = 0;
        const interval = setInterval(() => {
            setChats(prev => prev.map(chat => {
                if (chat.id !== chatId) return chat;
                const lastMsg = chat.messages[chat.messages.length - 1];
                if (!lastMsg || lastMsg.role !== 'assistant') return chat;
                return {
                    ...chat,
                    messages: [
                        ...chat.messages.slice(0, -1),
                        { ...lastMsg, content: fullText.slice(0, index), isTyping: true }
                    ]
                };
            }));
            index++;
            if (index > fullText.length) {
                clearInterval(interval);
                setChats(prev => prev.map(chat => chat.id === chatId ? {
                    ...chat,
                    messages: chat.messages.map(m => m.isTyping ? { ...m, isTyping: false } : m)
                } : chat));
                setInputLocked(false);
            }
        }, 10);
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        setSystemError(null);

        // 1. Setup IDs
        let currentChatId = activeChatId;
        let isNewChat = false;
        let tempChatId = null;

        if (!currentChatId) {
            isNewChat = true;
            tempChatId = Date.now();
            const newChat = {
                id: tempChatId,
                title: input.slice(0, 30),
                messages: [],
                pinned: false,
                isCustomTitle: false
            };
            setChats(prev => [newChat, ...prev]);
            setActiveChatId(tempChatId);
            currentChatId = tempChatId;
        }

        const userMessage = { role: "user", content: input };


        setChats(prev => prev.map(chat => {
            if (chat.id === currentChatId) {
                return {
                    ...chat,
                    title: (!chat.messages.length && !chat.isCustomTitle) ? input.slice(0, 30) : chat.title,
                    messages: [...chat.messages, userMessage]
                };
            }
            return chat;
        }));

        setInput("");
        setLoading(true);
        setInputLocked(true);

        try {

            let history = [userMessage];
            const existingChat = chats.find(c => c.id === currentChatId);
            if (!isNewChat && existingChat) {
                history = [...existingChat.messages, userMessage];
            }


            const idToSend = typeof currentChatId === 'number' ? null : currentChatId;
            const response = await sendChatMessage(history, idToSend);


            let finalChatId = currentChatId;

            if (response?.data?.chatId) {
                const realDbId = response.data.chatId;


                if (currentChatId !== realDbId) {
                    finalChatId = realDbId;


                    setChats(prev => prev.map(chat => {
                        if (chat.id === currentChatId) {
                            return {
                                ...chat,
                                id: realDbId,
                                messages: [
                                    ...chat.messages,
                                    { role: "assistant", content: "", isTyping: true }
                                ]
                            };
                        }
                        return chat;
                    }));

                    setActiveChatId(realDbId);
                    setDbChatId(realDbId);
                }
            }


            if (finalChatId === currentChatId) {
                setChats(prev => prev.map(chat =>
                    chat.id === finalChatId
                        ? { ...chat, messages: [...chat.messages, { role: "assistant", content: "", isTyping: true }] }
                        : chat
                ));
            }


            let aiText = "Thinking...";
            if (response?.data?.messages) aiText = response.data.messages[response.data.messages.length - 1].content;

            typeMessage(aiText, finalChatId);

        } catch (error) {
            console.error("Chat Error:", error);
            setSystemError("⚠️ Network error. Please check your connection.");
            setInputLocked(false);


            setChats(prev => prev.map(chat => {
                if (chat.id === currentChatId) {
                    return { ...chat, messages: chat.messages.slice(0, -1) };
                }
                return chat;
            }));
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="app-container">
            {sidebarOpen && (
                <aside className="sidebar">
                    <button className="new-chat-btn" onClick={createNewChat}>
                        <Plus size={16} /> New Chat
                    </button>
                    <div style={{ padding: '0 10px 10px 10px' }}>
                        <input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="auth-input" style={{ padding: '8px', fontSize: '14px', background: '#2f2f2f', border: '1px solid #444' }} />
                    </div>

                    <div className="history-list">
                        {[...filteredChats].sort((a, b) => Number(b.pinned || 0) - Number(a.pinned || 0)).map(chat => (
                            <div
                                key={chat.id}
                                className="history-item"
                                style={{
                                    background: chat.id === activeChatId ? "#2a2a2a" : "transparent",
                                    opacity: chat.id === activeChatId ? 1 : 0.7,
                                    position: 'relative',
                                    paddingRight: '30px',
                                    cursor: 'pointer',
                                    overflow: 'visible',
                                    zIndex: menuOpenId === chat.id ? 100 : 1,
                                }}
                                onClick={() => setActiveChatId(chat.id)}
                                onMouseEnter={() => setHoveredChatId(chat.id)}
                                onMouseLeave={() => setHoveredChatId(null)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                                    {chat.pinned && <Pin size={12} fill="#19c37d" color="#19c37d" style={{ minWidth: '12px' }} />}
                                    {!chat.pinned && <MessageSquare size={14} />}
                                    {editingChatId === chat.id ? (
                                        <input
                                            value={editingTitle}
                                            autoFocus
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            onBlur={() => saveRename(chat.id)}
                                            onKeyDown={(e) => e.key === "Enter" && saveRename(chat.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ background: '#333', border: 'none', color: 'white', width: '100%' }}
                                        />
                                    ) : (
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px' }} onDoubleClick={(e) => startRename(chat, e)}>{chat.title}</span>
                                    )}
                                </div>

                                {(hoveredChatId === chat.id || menuOpenId === chat.id) && (
                                    <button
                                        className="dots-trigger-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpenId(menuOpenId === chat.id ? null : chat.id);
                                        }}
                                        style={{
                                            position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)',
                                            background: 'transparent', border: 'none', color: '#c5c5d2',
                                            cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            borderRadius: '4px', zIndex: 20
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#40414f'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                )}

                                {menuOpenId === chat.id && (
                                    <div
                                        className="chat-menu-popup"
                                        style={{
                                            position: 'absolute', right: '10px', top: '30px', width: '150px',
                                            background: '#202123', border: '1px solid #444', borderRadius: '6px',
                                            padding: '6px', zIndex: 9999, boxShadow: '0 4px 15px rgba(0,0,0,0.8)',
                                            display: 'flex', flexDirection: 'column', gap: '2px'
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button onClick={(e) => handleShare(chat.id, e)} className="menu-item-btn" style={menuItemStyle}>
                                            <Share2 size={14} /> Share
                                        </button>
                                        <button onClick={(e) => startRename(chat, e)} className="menu-item-btn" style={menuItemStyle}>
                                            <Edit3 size={14} /> Rename
                                        </button>
                                        <button onClick={(e) => togglePinChat(chat.id, e)} className="menu-item-btn" style={menuItemStyle}>
                                            <Pin size={14} fill={chat.pinned ? "#fff" : "none"} /> {chat.pinned ? "Unpin" : "Pin"}
                                        </button>
                                        <div style={{ borderTop: '1px solid #333', margin: '4px 0' }}></div>
                                        <button onClick={(e) => deleteChat(chat.id, e)} className="menu-item-btn" style={{ ...menuItemStyle, color: '#ff4444' }}>
                                            <Trash size={14} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 'auto', padding: '10px', borderTop: '1px solid #333', position: 'relative' }}>
                        {showProfileModal && (
                            <div style={{
                                position: 'absolute', bottom: '100%', left: '10px', width: '240px',
                                background: '#202123', border: '1px solid #444', borderRadius: '6px',
                                padding: '12px', marginBottom: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                                zIndex: 100, color: 'white'
                            }}>
                                <div style={{ marginBottom: '10px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{user?.name || 'User'}</div>
                                    <div style={{ fontSize: '12px', color: '#8e8ea0' }}>{user?.email || 'No Email'}</div>
                                </div>
                                <div style={{ borderTop: '1px solid #444', margin: '8px 0' }}></div>
                                <button onClick={logout} style={{
                                    width: '100%', padding: '8px', background: 'transparent', border: 'none',
                                    color: '#ff4444', borderRadius: '4px', cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', gap: '8px', fontSize: '14px', textAlign: 'left'
                                }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#343541'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <LogOut size={16} /> Log out
                                </button>
                            </div>
                        )}
                        <div
                            className="history-item"
                            onClick={() => setShowProfileModal(!showProfileModal)}
                            style={{ cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}
                        >
                            <div style={{
                                width: '28px', height: '28px', background: '#19c37d', borderRadius: '4px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 'bold', fontSize: '14px'
                            }}>
                                {user?.name?.charAt(0).toUpperCase() || <User size={16} />}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: '14px', fontWeight: '500' }}>
                                {user?.name || 'My Account'}
                            </div>
                        </div>
                    </div>
                </aside>
            )}

            <main className="main-content">
                <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2000 }}>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                    >
                        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
                {systemError && <div className="system-banner">{systemError}</div>}

                <div className="chat-area">
                    {(!activeChat || !activeChat.messages || activeChat.messages.length === 0) ? (
                        <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
                            <h1 style={{ color: '#fff', marginBottom: '10px' }}>Gollo AI</h1>
                            <p>How can I help you today?</p>
                        </div>
                    ) : (
                        activeChat.messages.map((msg, i) => (
                            // 🔥 FIX: Added maxWidth and margin: auto to center messages like Gemini
                            <div key={i} className={`message-wrapper ${msg?.role || 'assistant'}`} style={{ maxWidth: '768px', margin: '0 auto', width: '100%' }}>
                                {msg?.role === 'assistant' && <div className="avatar" style={{ background: '#19c37d' }}><Bot size={20} color="white" /></div>}
                                <div className="message-bubble" style={{
                                    overflow: 'hidden',
                                    background: msg?.role === 'assistant' ? '#444654' : '#2f2f2f',
                                    padding: '12px 16px', borderRadius: '8px',
                                    marginLeft: msg?.role === 'assistant' ? '10px' : '0', textAlign: 'left',
                                }}>
                                    {msg?.role === 'user' ? (msg?.content) : (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                code({ node, inline, className, children, ...props }) {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    return !inline && match ? (
                                                        <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
                                                            {String(children).replace(/\n$/, '')}
                                                        </SyntaxHighlighter>
                                                    ) : (
                                                        <code className={className} {...props}>{children}</code>
                                                    );
                                                }
                                            }}
                                        >
                                            {msg?.content || ""}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {loading && (
                        // 🔥 FIX: Added maxWidth and margin: auto to center loading bubble too
                        <div className="message-wrapper assistant" style={{ maxWidth: '768px', margin: '0 auto', width: '100%' }}>
                            <div className="avatar" style={{ background: '#19c37d' }}><Bot size={20} color="white" /></div>
                            <div className="message-bubble" style={{ background: '#444654', padding: '12px 16px', borderRadius: '8px', marginLeft: '10px' }}><span className="cursor">|</span></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="input-container">
                    <div className="input-box-wrapper">
                        <textarea
                            rows={1} placeholder="Message Gollo AI..." value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                            }}
                            onKeyDown={handleKeyDown} disabled={inputLocked}
                        />
                        <button className="send-btn" onClick={handleSend} disabled={loading || !input.trim() || inputLocked}>
                            <Send size={18} />
                        </button>
                    </div>
                    <div className="disclaimer-text">Gollo AI can make mistakes. Consider checking important information.</div>
                </div>
            </main>
        </div>
    );
};

const menuItemStyle = {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px', width: '100%',
    background: 'transparent', border: 'none', color: 'white',
    fontSize: '13px', textAlign: 'left', cursor: 'pointer',
    borderRadius: '4px'
};

export default Chat;