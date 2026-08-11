import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Eye, EyeOff, Mail, Lock, User, Check, X, UserCircle, Coffee, Phone } from "lucide-react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import AWS from 'aws-sdk';
import CryptoJS from 'crypto-js';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
    const navigate = useNavigate();
    const { user, login: authLogin, logout: authLogout } = useAuth();
    const cafeHeroImage = `${process.env.PUBLIC_URL}/cafe.jpg`;
    const [activeTab, setActiveTab] = useState("login");
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [role, setRole] = useState('customer'); // Default role
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Password requirements
    const passwordRequirements = [
        { label: 'At least 8 characters', test: (p) => p.length >= 8 },
        { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
        { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
        { label: 'One number', test: (p) => /\d/.test(p) },
        { label: 'One special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
    ];

    // Generate SECRET_HASH for Cognito using crypto-js
    const generateSecretHash = (username, clientId, clientSecret) => {
        const message = username + clientId;
        const hash = CryptoJS.HmacSHA256(message, clientSecret);
        return CryptoJS.enc.Base64.stringify(hash);
    };

    // User info is managed by AuthProvider, no need for fetchUserInfo

    // Handle login with JWT
    const onSubmitLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await authLogin(username, password);
            console.log('Login result:', result); // Debug log
            console.log('result.isAdmin:', result.isAdmin);
            console.log('result.userInfo:', result.userInfo);
            console.log('result.userInfo?.role:', result.userInfo?.role);

            // Check if user is admin from multiple sources
            const isAdmin = result.isAdmin || result.userInfo?.role === 'admin' || result.userInfo?.isAdmin;
            console.log('Final isAdmin value:', isAdmin);

            toast.success("Welcome back!", {
                description: isAdmin ? "Redirecting to admin panel..." : "Login successful"
            });
            setDialogOpen(false);

            if (isAdmin) {
                console.log('Redirecting to /admin');
                navigate("/admin");
            } else {
                console.log('Redirecting to /');
                navigate("/");
            }
        } catch (err) {
            console.error("Login failure:", err);
            toast.error("Login failed", {
                description: err.message || "Invalid credentials"
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle register
    const onSubmit = async (event) => {
        event.preventDefault();

        if (!username || !password || !name || !email || !phoneNumber) {
            toast.error("Missing fields", {
                description: "Please fill in all fields to register"
            });
            return;
        }

        // Basic phone validation (allow spaces, dashes, parentheses, plus)
        const cleanPhone = phoneNumber.replace(/[\s()-]/g, '');
        if (cleanPhone.length < 10) {
            toast.error("Invalid phone number", {
                description: "Please enter a valid phone number (at least 10 digits)"
            });
            return;
        }

        const clientId = "5fjijmj2a8q3n919rga3mhlnpi";
        const clientSecret = "q8kaourmo7v4v34sgek9j9g4qa7703d5o28a0n92jl7ltbvpaf7";
        const region = "us-east-1";

        const secretHash = generateSecretHash(username, clientId, clientSecret);

        const cognito = new AWS.CognitoIdentityServiceProvider({ region });

        // Format phone number to E.164
        // If it sends with +, use as is. If no +, assume it needs one. 
        // Note: Ideally we'd valid country code, but + prepending is a safe fallback for now if user omits it.
        const formattedPhoneNumber = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

        const params = {
            ClientId: clientId,
            SecretHash: secretHash,
            Username: username,
            Password: password,
            UserAttributes: [
                {
                    Name: "email",
                    Value: email,
                },
                {
                    Name: "name",
                    Value: name,
                },
                {
                    Name: "phone_number",
                    Value: formattedPhoneNumber,
                },
            ],
        };

        try {
            const data = await cognito.signUp(params).promise();
            console.log("Sign-up successful:", data);
            toast.success("Registration successful!", {
                description: "Please check your email for verification code"
            });

            // persist registration info so verify page can include email/name/role
            localStorage.setItem('username', username);
            localStorage.setItem('email', email);
            localStorage.setItem('name', name);
            localStorage.setItem('role', role); // Save role to localStorage

            // Close dialog before navigating
            setDialogOpen(false);

            // Small delay to allow dialog to close smoothly
            setTimeout(() => {
                navigate('/verify-email');
            }, 100);
        } catch (err) {
            console.error("Error during sign-up:", err);
            toast.error("Registration failed", {
                description: err.message || "Error during sign-up"
            });
        }
    };

    // Handle logout with JWT
    const onLogout = async () => {
        try {
            await authLogout();
            toast.success("Logged out successfully");
            navigate("/");
        } catch (err) {
            console.error("Logout error:", err);
            toast.error("Logout failed", {
                description: err.message || "An error occurred"
            });
        }
    };

    const onUserProfile = () => {
        navigate("/user-profile");
    };

    return (
        <header className="fixed top-0 w-full bg-gradient-to-r from-[#0F4C4C] via-[#0B6B6B] to-[#0F6F5F] shadow z-50">
            <nav className="container flex items-center justify-between h-20">
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-3">
                        <img src="/logo.png" alt="BrewCraft" className="w-12 h-12 rounded-md object-cover shadow-sm" />
                        <span className="text-white text-xl font-semibold">BrewCraft</span>
                    </Link>
                </div>

                <div className="hidden md:flex items-center gap-10">
                    <Link to="/" className="text-white hover:text-yellow-200 transition font-medium">
                        Home
                    </Link>
                    <Link to="/menu" className="text-white hover:text-yellow-200 transition font-medium">
                        Menu
                    </Link>
                    <Link to="/table" className="text-white hover:text-yellow-200 transition font-medium">
                        Table
                    </Link>
                    <Link to="/contact-us" className="text-white hover:text-yellow-200 transition font-medium">
                        Contact Us
                    </Link>
                    {user && (
                        <>
                            <Link to="/my-bookings" className="text-white hover:text-yellow-200 transition font-medium">
                                My Bookings
                            </Link>
                            <Link to="/chat" className="text-white hover:text-yellow-200 transition font-medium flex items-center gap-2">
                                <MessageCircle className="w-5 h-5" />
                                Chat
                            </Link>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="hidden md:block bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                                <div className="text-xs text-white/80 font-medium">Welcome back</div>
                                <div
                                    onClick={onUserProfile}
                                    className="font-semibold text-white hover:text-yellow-200 cursor-pointer transition-colors flex items-center gap-1.5"
                                >
                                    <UserCircle className="w-4 h-4" />
                                    {user.username}
                                </div>
                            </div>
                            <Button
                                onClick={onLogout}
                                className="bg-white/90 backdrop-blur-sm text-teal-700 hover:bg-white hover:scale-105 transition-all px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl border border-white/50"
                            >
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-white text-[#0F4C4C] hover:bg-amber-50 hover:text-[#0B3F3F] hover:scale-105 transition-all px-6 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-xl border border-white focus-visible:ring-white">
                                    Login
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="max-h-[92vh] max-w-[92vw] overflow-hidden overflow-y-auto rounded-2xl border-0 bg-transparent p-0 shadow-2xl sm:max-w-3xl">
                                <div className="grid bg-white md:grid-cols-[0.9fr_1.1fr]">
                                    <div className="relative hidden overflow-hidden bg-[#123837] p-8 text-white md:flex md:flex-col md:justify-between">
                                        <img
                                            src={cafeHeroImage}
                                            alt=""
                                            aria-hidden="true"
                                            className="absolute inset-0 h-full w-full object-cover opacity-25"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#0f4c4c]/95 via-[#123837]/90 to-[#2b2118]/95" />
                                        <div className="relative">
                                            <div className="mb-10 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg backdrop-blur">
                                                <Coffee className="h-6 w-6" />
                                            </div>
                                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
                                                BrewCraft
                                            </p>
                                            <h2 className="text-3xl font-bold leading-tight">
                                                Fresh coffee, warm tables, one simple account.
                                            </h2>
                                            <p className="mt-4 text-sm leading-6 text-white/75">
                                                Manage bookings, chat with the cafe, and keep your favorite orders close.
                                            </p>
                                        </div>
                                        <div className="relative rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white/80 backdrop-blur">
                                            <div className="font-semibold text-white">Today at BrewCraft</div>
                                            <div className="mt-1">Reserve faster and come back to your saved details anytime.</div>
                                        </div>
                                    </div>

                                    <div className="relative p-5 sm:p-7">
                                        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-teal-500 via-amber-300 to-cyan-500" />
                                        <DialogHeader className="pr-8 text-left">
                                            <DialogTitle className="text-2xl font-bold leading-tight text-slate-950">
                                                {activeTab === "login" ? "Welcome back" : "Create your account"}
                                            </DialogTitle>
                                            <DialogDescription className="mt-1 text-sm text-slate-500">
                                                {activeTab === "login"
                                                    ? "Sign in to continue your BrewCraft experience."
                                                    : "Join BrewCraft to book tables and manage your visits."}
                                            </DialogDescription>
                                        </DialogHeader>
                                    {/* Tab Buttons */}
                                    <div className="mt-6 mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                                        <button
                                            type="button"
                                            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${activeTab === "login"
                                                ? "bg-white text-teal-700 shadow-sm"
                                                : "text-slate-500 hover:text-slate-800"
                                                }`}
                                            onClick={() => setActiveTab("login")}
                                        >
                                            Login
                                        </button>
                                        <button
                                            type="button"
                                            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${activeTab === "register"
                                                ? "bg-white text-teal-700 shadow-sm"
                                                : "text-slate-500 hover:text-slate-800"
                                                }`}
                                            onClick={() => setActiveTab("register")}
                                        >
                                            Register
                                        </button>
                                    </div>

                                    {activeTab === "login" && (
                                        <form className="space-y-4" onSubmit={onSubmitLogin}>
                                            {/* Username Field */}
                                            <div>
                                                <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                    Username
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                        <User className="h-4 w-4 text-teal-600" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        id="username"
                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 shadow-inner transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                                                        placeholder="Enter your username"
                                                        value={username}
                                                        onChange={(event) => setUsername(event.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Password Field */}
                                            <div>
                                                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                    Password
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                        <Lock className="h-4 w-4 text-teal-600" />
                                                    </div>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        id="password"
                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm text-slate-900 shadow-inner transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                                                        placeholder="Enter your password"
                                                        value={password}
                                                        onChange={(event) => setPassword(event.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Forgot Password */}
                                            <div className="flex justify-end">
                                                <button type="button" className="text-xs text-teal-700 hover:text-teal-600 font-semibold">
                                                    Forgot password?
                                                </button>
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="h-11 w-full rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-600/20 transition-all hover:from-teal-700 hover:to-cyan-700 hover:shadow-xl hover:shadow-teal-600/25 focus-visible:ring-teal-600 disabled:opacity-50"
                                            >
                                                {loading ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Signing in...
                                                    </span>
                                                ) : "Sign In"}
                                            </Button>
                                        </form>
                                    )}

                                    {activeTab === "register" && (
                                        <form className="space-y-3" onSubmit={onSubmit}>
                                            {/* Name and Email in 2 columns */}
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {/* Name Field */}
                                                <div>
                                                    <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                        Full Name
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <User className="h-4 w-4 text-teal-600" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            id="name"
                                                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 shadow-inner transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                                                            placeholder="Your name"
                                                            value={name}
                                                            onChange={(event) => setName(event.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Username Field */}
                                                <div>
                                                    <label htmlFor="reg-username" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                        Username
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <User className="h-4 w-4 text-teal-600" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            id="reg-username"
                                                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 shadow-inner transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                                                            placeholder="Username"
                                                            value={username}
                                                            onChange={(event) => setUsername(event.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Email and Phone in 2 columns */}
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {/* Email Field */}
                                                <div>
                                                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                        Email Address
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <Mail className="h-4 w-4 text-teal-600" />
                                                        </div>
                                                        <input
                                                            type="email"
                                                            id="email"
                                                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 shadow-inner transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                                                            placeholder="Enter email"
                                                            value={email}
                                                            onChange={(event) => setEmail(event.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Phone Number Field */}
                                                <div>
                                                    <label htmlFor="phoneNumber" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                        Phone Number
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <Phone className="h-4 w-4 text-teal-600" />
                                                        </div>
                                                        <input
                                                            type="tel"
                                                            id="phoneNumber"
                                                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 shadow-inner transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                                                            placeholder="0123456789"
                                                            value={phoneNumber}
                                                            onChange={(event) => setPhoneNumber(event.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Role and Password in 2 columns */}
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {/* Role Field */}
                                                <div>
                                                    <label htmlFor="role" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                        Role
                                                    </label>
                                                    <div className="relative">
                                                        <select
                                                            id="role"
                                                            className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-9 text-sm text-slate-900 shadow-inner transition-colors hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                                                            value={role}
                                                            onChange={(event) => setRole(event.target.value)}
                                                        >
                                                            <option value="customer">Customer</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Password Field */}
                                                <div>
                                                    <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                        Password
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <Lock className="h-4 w-4 text-teal-600" />
                                                        </div>
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            id="reg-password"
                                                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-10 text-sm text-slate-900 shadow-inner transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                                                            placeholder="Password"
                                                            value={password}
                                                            onChange={(event) => setPassword(event.target.value)}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                                                        >
                                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Password Requirements - Compact 2 columns */}
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                                <p className="text-xs font-semibold text-slate-600 mb-2">Password requirements:</p>
                                                <div className="grid gap-x-3 gap-y-1 sm:grid-cols-2">
                                                    {passwordRequirements.map((req, index) => {
                                                        const isValid = req.test(password);
                                                        return (
                                                            <div key={index} className="flex items-center gap-1.5">
                                                                {isValid ? (
                                                                    <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                                                ) : (
                                                                    <X className="h-3 w-3 text-slate-300 flex-shrink-0" />
                                                                )}
                                                                <span className={`text-xs ${isValid ? 'text-green-600' : 'text-slate-500'}`}>
                                                                    {req.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="h-11 w-full rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-600/20 transition-all hover:from-teal-700 hover:to-cyan-700 hover:shadow-xl hover:shadow-teal-600/25 focus-visible:ring-teal-600 disabled:opacity-50"
                                            >
                                                {loading ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Creating...
                                                    </span>
                                                ) : "Create Account"}
                                            </Button>
                                        </form>
                                    )}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;
