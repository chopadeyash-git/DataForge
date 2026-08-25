import React, { useState, useRef, useEffect } from 'react';
import { 
  FiUpload, 
  FiSend, 
  FiDownload, 
  FiDatabase, 
  FiMessageCircle,
  FiBarChart2,
  FiFileText,
  FiRefreshCw,
  FiInfo,
  FiTrendingUp,
  FiFilter,
  FiEdit3,
  FiZap,
  FiActivity,
  FiCpu,
  FiPlay,
  FiStar,
  FiTarget,
  FiCommand,
  FiLayers
} from 'react-icons/fi';
import { toast, Toaster } from 'react-hot-toast';

// Custom CSS for hiding scrollbars
const scrollbarHideStyle = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = scrollbarHideStyle;
  document.head.appendChild(style);
}

const AIDataAssistant = () => {
  const [dataset, setDataset] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "🚀 Welcome to your AI Data Assistant! I'm here to help you analyze, clean, and transform your data using natural language. Upload a CSV, Excel, or JSON file to get started!",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-assistant/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setDataset({
          filename: file.name,
          summary: data.summary,
          preview: data.preview
        });

        const newMessage = {
          id: Date.now(),
          type: 'assistant',
          content: `✅ **Dataset loaded successfully!**\n\n📊 **Summary:**\n• **Rows:** ${data.summary.basic_info.rows.toLocaleString()}\n• **Columns:** ${data.summary.basic_info.columns}\n• **Size:** ${data.summary.basic_info.size_mb} MB\n\n🔍 **Sample columns:** ${data.summary.columns.slice(0, 3).map(col => col.name).join(', ')}${data.summary.columns.length > 3 ? '...' : ''}\n\nNow you can ask me questions like:\n• "What is this dataset about?"\n• "Calculate mean of [column name]"\n• "Drop column [column name]"\n• "Filter rows where [column] > [value]"\n• "Replace missing values with mean"`,
          timestamp: new Date(),
          data: data.summary
        };

        setMessages(prev => [...prev, newMessage]);
        toast.success('Dataset loaded successfully!');
      } else {
        toast.error(data.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: inputMessage }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          messageType: data.type,
          data: data.data,
          value: data.value,
          downloadAvailable: data.download_available,
          downloadUrl: data.download_url,
          filename: data.filename
        };

        setMessages(prev => [...prev, assistantMessage]);

        if (data.type === 'success') {
          toast.success('Operation completed successfully!');
        }
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: `❌ **Error:** ${data.error}`,
          timestamp: new Date(),
          messageType: 'error'
        };

        setMessages(prev => [...prev, errorMessage]);
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: '❌ **Error:** Failed to process your request. Please try again.',
        timestamp: new Date(),
        messageType: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to process request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExportDataset = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-assistant/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        const downloadResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}${data.download_url}`, {
          credentials: 'include'
        });

        if (downloadResponse.ok) {
          const blob = await downloadResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = data.filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast.success('Dataset exported successfully!');
        }
      } else {
        toast.error(data.error || 'Failed to export dataset');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export dataset');
    }
  };

  const handleDownload = async (downloadUrl, filename) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${downloadUrl}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('File downloaded successfully!');
      } else {
        toast.error('Failed to download file');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const formatMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const getMessageIcon = (type, messageType) => {
    if (type === 'user') return <FiMessageCircle className="w-5 h-5" />;
    
    switch (messageType) {
      case 'analysis':
        return <FiBarChart2 className="w-5 h-5 text-blue-600" />;
      case 'result':
        return <FiTrendingUp className="w-5 h-5 text-green-600" />;
      case 'success':
        return <FiRefreshCw className="w-5 h-5 text-green-600" />;
      case 'error':
        return <FiInfo className="w-5 h-5 text-red-600" />;
      case 'help':
        return <FiInfo className="w-5 h-5 text-yellow-600" />;
      default:
        return <FiZap className="w-5 h-5 text-purple-600" />;
    }
  };

  const quickCommands = [
    { text: "What is this dataset about?", icon: FiInfo, color: "from-blue-500 to-cyan-500" },
    { text: "Show me missing values", icon: FiBarChart2, color: "from-purple-500 to-pink-500" },
    { text: "Calculate mean", icon: FiTrendingUp, color: "from-green-500 to-emerald-500" },
    { text: "Drop rows with missing values", icon: FiFilter, color: "from-orange-500 to-red-500" },
    { text: "Export dataset", icon: FiDownload, color: "from-indigo-500 to-purple-500" },
    { text: "Show history options", icon: FiFileText, color: "from-teal-500 to-blue-500" }
  ];

  return (
    <>
      <Toaster position="top-right" />
      <div className="h-screen bg-white p-6 pt-20 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-50"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full mb-4 animate-pulse shadow-2xl">
              <FiCpu className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              AI Data Assistant
            </h1>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Transform your data with the power of AI. Upload, analyze, and manipulate datasets using natural language commands.
            </p>
            
            <div className="flex justify-center items-center space-x-6 mt-6">
              <div className="flex items-center space-x-2 text-purple-600">
                <FiZap className="w-5 h-5" />
                <span className="text-sm font-medium">AI-Powered</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-600">
                <FiActivity className="w-5 h-5" />
                <span className="text-sm font-medium">Real-time</span>
              </div>
              <div className="flex items-center space-x-2 text-indigo-600">
                <FiTarget className="w-5 h-5" />
                <span className="text-sm font-medium">Intelligent</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6" style={{height: 'calc(100vh - 240px)'}}>
            <div className="lg:col-span-1 flex flex-col order-1 lg:order-1">
              <div className="bg-white rounded-xl lg:rounded-2xl border border-gray-200 shadow-lg p-3 lg:p-4 hover:shadow-xl transition-all duration-300 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <FiDatabase className="w-4 h-4 text-white" />
                  </div>
                  Dataset Manager
                </h3>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.xlsx,.xls,.json"
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 lg:py-3 px-3 lg:px-4 rounded-lg lg:rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 group text-sm lg:text-base"
                >
                  {isUploading ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-3 w-5 h-5" />
                      <span className="font-medium">Processing...</span>
                    </>
                  ) : (
                    <>
                      <FiUpload className="mr-3 w-5 h-5 group-hover:animate-bounce" />
                      <span className="font-medium">Upload Dataset</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide mt-4">
                <div className="space-y-4">
                  {dataset && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 hover:shadow-xl transition-all duration-300">
                      <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-400/30 backdrop-blur-sm animate-fadeIn">
                        <h4 className="font-semibold text-green-700 mb-3 truncate flex items-center" title={dataset.filename}>
                          <FiStar className="w-4 h-4 mr-2 text-yellow-500" />
                          {dataset.filename}
                        </h4>
                        <div className="grid grid-cols-1 gap-2 text-sm text-green-700">
                          <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                            <span className="flex items-center"><FiBarChart2 className="w-4 h-4 mr-2" />Rows</span>
                            <span className="font-bold">{dataset.summary.basic_info.rows.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                            <span className="flex items-center"><FiFilter className="w-4 h-4 mr-2" />Columns</span>
                            <span className="font-bold">{dataset.summary.basic_info.columns}</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                            <span className="flex items-center"><FiDatabase className="w-4 h-4 mr-2" />Size</span>
                            <span className="font-bold">{dataset.summary.basic_info.size_mb} MB</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-green-300/30">
                          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                            <FiLayers className="w-4 h-4 mr-2" />
                            Dataset Columns
                          </h4>
                          <div className="max-h-32 overflow-y-auto space-y-1 scrollbar-hide">
                            {dataset.summary.columns.slice(0, 10).map((col, index) => (
                              <div key={index} className="text-xs bg-white/50 rounded-lg p-1.5 border border-green-300/30 hover:bg-white/70 transition-colors">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-gray-800">{col.name}</span>
                                  <span className="text-gray-600 text-xs px-2 py-1 bg-gray-100 rounded">{col.type}</span>
                                </div>
                              </div>
                            ))}
                            {dataset.summary.columns.length > 10 && (
                              <div className="text-xs text-gray-500 italic text-center py-2">
                                +{dataset.summary.columns.length - 10} more columns available
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                        <FiCommand className="w-4 h-4 text-white" />
                      </div>
                      Smart Actions
                    </h3>
                    
                    <div className="space-y-2">
                      {quickCommands.map((command, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            if (dataset) {
                              setMessages(prev => [...prev, {
                                id: Date.now(),
                                type: 'user',
                                content: command.text,
                                timestamp: new Date()
                              }]);
                              setIsLoading(true);
                              
                              fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-assistant/chat`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ message: command.text }),
                                credentials: 'include'
                              })
                              .then(response => response.json())
                              .then(data => {
                                setMessages(prev => [...prev, {
                                  id: Date.now() + 1,
                                  type: 'assistant',
                                  content: data.success ? data.response : `❌ ${data.error}`,
                                  timestamp: new Date(),
                                  messageType: data.type || 'error',
                                  downloadAvailable: data.download_available,
                                  downloadUrl: data.download_url,
                                  filename: data.filename
                                }]);
                              })
                              .catch(() => {
                                setMessages(prev => [...prev, {
                                  id: Date.now() + 1,
                                  type: 'assistant',
                                  content: '❌ Failed to process request',
                                  timestamp: new Date()
                                }]);
                              })
                              .finally(() => setIsLoading(false));
                            }
                          }}
                          className="w-full text-left p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-300 flex items-center text-sm text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 group transform hover:scale-105"
                          disabled={!dataset}
                        >
                          <div className={`w-6 h-6 bg-gradient-to-r ${command.color} rounded-lg flex items-center justify-center mr-2 group-hover:scale-110 transition-transform`}>
                            <command.icon className="w-3 h-3 text-white" />
                          </div>
                          <span className="font-medium flex-1 text-gray-800">{command.text}</span>
                          <FiPlay className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 flex flex-col order-2 lg:order-2">
              <div className="bg-white rounded-xl lg:rounded-2xl border border-gray-200 shadow-lg flex-1 flex flex-col min-h-0">
                <div className="p-3 lg:p-4 border-b border-gray-200">
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-800 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                      <FiMessageCircle className="w-5 h-5 text-white" />
                    </div>
                    AI Chat Interface
                  </h2>
                  <p className="text-gray-600 mt-2 text-lg">
                    Communicate with your data using natural language commands
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 font-medium">AI Online</span>
                    </div>
                    {dataset && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-blue-600 font-medium">Dataset Ready</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4 min-h-0 scrollbar-hide" style={{maxHeight: 'calc(100vh - 320px)'}}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 shadow-lg ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border border-purple-400/30'
                            : 'bg-white border border-gray-200 text-gray-800'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {message.type === 'assistant' && (
                            <div className="flex-shrink-0 mt-1">
                              {getMessageIcon(message.type, message.messageType)}
                            </div>
                          )}
                          <div className="flex-1">
                            <div 
                              className="prose prose-sm max-w-none text-inherit"
                              dangerouslySetInnerHTML={{ 
                                __html: formatMessage(message.content) 
                              }}
                            />
                            
                            {message.downloadAvailable && message.downloadUrl && (
                              <button
                                onClick={() => handleDownload(message.downloadUrl, message.filename)}
                                className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center text-sm"
                              >
                                <FiDownload className="mr-2" />
                                Download {message.filename}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 max-w-[85%]">
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-gray-700 font-medium">AI is analyzing your request...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 lg:p-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex-1 relative">
                      <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={dataset ? "✨ Ask me anything about your data..." : "📁 Upload a dataset to get started"}
                        disabled={!dataset || isLoading}
                        className="w-full resize-none bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        rows="2"
                      />
                      {inputMessage && (
                        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                          {inputMessage.length}/500
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || !dataset || isLoading}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 group"
                    >
                      <FiSend className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-xs text-gray-500 flex items-center space-x-4">
                      <span className="flex items-center">
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs mr-1">Enter</kbd>
                        to send
                      </span>
                      <span className="flex items-center">
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs mr-1">Shift+Enter</kbd>
                        new line
                      </span>
                    </div>
                    {dataset && (
                      <button
                        onClick={handleExportDataset}
                        className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center space-x-2 transition-colors"
                      >
                        <FiDownload className="w-4 h-4" />
                        <span>Export Dataset</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIDataAssistant;