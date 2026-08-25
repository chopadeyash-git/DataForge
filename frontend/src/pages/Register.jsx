import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { API_BASE_URL } from '../config.js'
import { FiUserPlus, FiUser, FiMail, FiKey, FiArrowLeft } from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi'

export default function Register() {
	const [username, setUsername] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()

	// Check if already authenticated
	useEffect(() => {
		checkAuthStatus()
	}, [])

	const checkAuthStatus = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
				credentials: 'include'
			})
			const data = await response.json()
			
			if (data.is_authenticated) {
				navigate('/')
			}
		} catch (error) {
			console.error('Auth check failed:', error)
		}
	}

	async function onSubmit(e) {
		e.preventDefault()
		setError('')
		setLoading(true)

		if (!username.trim() || !email.trim() || !password || !confirmPassword) {
			setError('Please fill in all fields')
			setLoading(false)
			return
		}

		if (password !== confirmPassword) {
			setError('Passwords do not match')
			setLoading(false)
			return
		}

		if (password.length < 6) {
			setError('Password must be at least 6 characters long')
			setLoading(false)
			return
		}

		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username, email, password }),
				credentials: 'include'
			})

			const data = await response.json()

			if (response.ok && data.success) {
				// Registration successful, redirect to dashboard
				navigate('/')
				// Trigger navbar refresh by reloading
				window.location.reload()
			} else {
				setError(data.error || 'Registration failed')
			}
		} catch (err) {
			setError('Cannot connect to server. Please make sure the backend is running.')
			console.error('Registration error:', err)
		} finally {
			setLoading(false)
		}
	}

	return (
			<div style={{ 
				display: 'flex', 
				alignItems: 'center', 
				justifyContent: 'center', 
				minHeight: 'calc(100vh - var(--navbar-height))',
				padding: '20px'
			}}>
				<div style={{
					background: 'white',
					borderRadius: '20px',
					boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
					maxWidth: '500px',
					width: '100%',
					overflow: 'hidden'
				}}>
					<div style={{
						background: 'var(--gradient-primary)',
						color: 'white',
						padding: '24px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						position: 'relative'
					}}>
						<div style={{ position: 'absolute', top: '10px', right: '10px', opacity: 0.1, fontSize: '40px' }}>
							<HiSparkles />
						</div>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '1.2rem' }}>
							<FiUserPlus size={20} />
							Create Account
						</div>
						<button 
							style={{
								background: 'rgba(255, 255, 255, 0.2)',
								border: '1px solid rgba(255, 255, 255, 0.3)',
								color: 'white',
								padding: '8px 16px',
								borderRadius: '8px',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '4px'
							}} 
							onClick={()=>navigate(-1)}
						>
							<FiArrowLeft size={16} />
							Back
						</button>
					</div>
					<div style={{ padding: '32px' }}>
						<p style={{ color: '#1f2937', marginBottom: '24px', textAlign: 'center', fontWeight: '500' }}>
							Join the AI data cleaning revolution
						</p>
						{error && (
							<div style={{
								background: '#fef2f2',
								border: '1px solid #fecaca',
								color: '#dc2626',
								padding: '12px',
								borderRadius: '8px',
								marginBottom: '20px'
							}}>
								{error}
							</div>
						)}
						<form onSubmit={onSubmit}>
							<div style={{ marginBottom: '20px' }}>
								<div style={{
									display: 'flex',
									alignItems: 'center',
									border: '2px solid #e2e8f0',
									borderRadius: '12px',
									overflow: 'hidden',
									transition: 'border-color 0.2s ease'
								}}>
									<div style={{
										padding: '12px 16px',
										background: '#f8fafc',
										borderRight: '2px solid #e2e8f0',
										color: 'var(--primary-600)'
									}}>
										<FiUser size={18} />
									</div>
									<input 
										style={{
											flex: 1,
											padding: '12px 16px',
											border: 'none',
											outline: 'none',
											fontSize: '16px'
										}}
										placeholder="Username" 
										value={username} 
										onChange={(e)=>setUsername(e.target.value)} 
										required 
									/>
								</div>
							</div>
							<div style={{ marginBottom: '20px' }}>
								<div style={{
									display: 'flex',
									alignItems: 'center',
									border: '2px solid #e2e8f0',
									borderRadius: '12px',
									overflow: 'hidden'
								}}>
									<div style={{
										padding: '12px 16px',
										background: '#f8fafc',
										borderRight: '2px solid #e2e8f0',
										color: 'var(--primary-600)'
									}}>
										<FiMail size={18} />
									</div>
									<input 
										style={{
											flex: 1,
											padding: '12px 16px',
											border: 'none',
											outline: 'none',
											fontSize: '16px'
										}}
										type="email" 
										placeholder="Email" 
										value={email} 
										onChange={(e)=>setEmail(e.target.value)} 
										required 
									/>
								</div>
							</div>
							<div style={{ marginBottom: '20px' }}>
								<div style={{
									display: 'flex',
									alignItems: 'center',
									border: '2px solid #e2e8f0',
									borderRadius: '12px',
									overflow: 'hidden'
								}}>
									<div style={{
										padding: '12px 16px',
										background: '#f8fafc',
										borderRight: '2px solid #e2e8f0',
										color: 'var(--primary-600)'
									}}>
										<FiKey size={18} />
									</div>
									<input 
										style={{
											flex: 1,
											padding: '12px 16px',
											border: 'none',
											outline: 'none',
											fontSize: '16px'
										}}
										type="password" 
										placeholder="Password" 
										value={password} 
										onChange={(e)=>setPassword(e.target.value)} 
										required 
									/>
								</div>
							</div>
							<div style={{ marginBottom: '24px' }}>
								<div style={{
									display: 'flex',
									alignItems: 'center',
									border: '2px solid #e2e8f0',
									borderRadius: '12px',
									overflow: 'hidden'
								}}>
									<div style={{
										padding: '12px 16px',
										background: '#f8fafc',
										borderRight: '2px solid #e2e8f0',
										color: 'var(--primary-600)'
									}}>
										<FiKey size={18} />
									</div>
									<input 
										style={{
											flex: 1,
											padding: '12px 16px',
											border: 'none',
											outline: 'none',
											fontSize: '16px'
										}}
										type="password" 
										placeholder="Confirm Password" 
										value={confirmPassword} 
										onChange={(e)=>setConfirmPassword(e.target.value)} 
										required 
									/>
								</div>
							</div>
							<button 
								className="btn-primary" 
								style={{ 
									width: '100%', 
									fontSize: '16px',
									opacity: loading ? 0.7 : 1,
									cursor: loading ? 'not-allowed' : 'pointer'
								}} 
								type="submit"
								disabled={loading}
							>
								{loading ? 'Creating Account...' : 'Create Account'}
							</button>
						</form>
						<div style={{ 
							display: 'flex', 
							justifyContent: 'center', 
							alignItems: 'center', 
							marginTop: '24px',
							paddingTop: '24px',
							borderTop: '1px solid #e2e8f0'
						}}>
							<span style={{ color: '#6b7280', marginRight: '8px' }}>Already have an account?</span>
							<Link 
								to="/login" 
								style={{ 
									color: 'var(--primary-600)', 
									textDecoration: 'none',
									fontWeight: '500'
								}}
							>
								Sign In
							</Link>
						</div>
					</div>
				</div>
			</div>
	)
}