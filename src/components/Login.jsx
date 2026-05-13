import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Login() {
    const { loginWithGoogle } = useAuth();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleGoogleLogin() {
        try {
            setError("");
            setLoading(true);
            const userCredential = await loginWithGoogle();
            const user = userCredential.user;

            // Check if user has an alias
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists() && docSnap.data().companyAlias) {
                navigate("/");
            } else {
                navigate("/setup-alias");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to log in with Google");
        }
        setLoading(false);
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0f1117] p-4">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600/10 rounded-2xl mb-4">
                        <span className="text-2xl">🏢</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight mb-1">NexTask Inc.</h1>
                    <p className="text-sm text-gray-500">AI Workplace Simulator</p>
                </div>

                {/* Card */}
                <div className="bg-[#1a1d24] border border-white/5 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white text-center mb-1">Welcome back</h2>
                    <p className="text-xs text-gray-500 text-center mb-6">Sign in to start your shift</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-xl text-xs mb-4 text-center">
                            {error}
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full bg-white text-gray-800 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        {loading ? "Connecting..." : "Sign in with Google"}
                    </motion.button>
                </div>

                <p className="text-center mt-6 text-[9px] text-gray-700 uppercase tracking-[0.2em]">
                    NexTask Inc. &copy; 2026 • Employment Simulator
                </p>
            </motion.div>
        </div>
    );
}
