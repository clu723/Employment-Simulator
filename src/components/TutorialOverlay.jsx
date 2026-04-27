import React, { useState, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '../context/TutorialContext';

const PADDING = 10;
const TOOLTIP_WIDTH = 320;

function getTooltipStyle(spotlight, windowW, windowH) {
    if (!spotlight) {
        return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: Math.min(TOOLTIP_WIDTH, windowW * 0.92) };
    }
    const GAP = 14;
    const w = Math.min(TOOLTIP_WIDTH, windowW * 0.92);
    const clampLeft = (l) => Math.max(8, Math.min(l, windowW - w - 8));

    // Below
    if (spotlight.bottom + 180 + GAP < windowH) {
        return { position: 'fixed', top: spotlight.bottom + GAP, left: clampLeft(spotlight.left), width: w };
    }
    // Above
    if (spotlight.top - 180 - GAP > 0) {
        return { position: 'fixed', bottom: windowH - spotlight.top + GAP, left: clampLeft(spotlight.left), width: w };
    }
    // Right
    if (spotlight.right + w + GAP < windowW) {
        return { position: 'fixed', top: Math.max(8, spotlight.top), left: spotlight.right + GAP, width: w };
    }
    // Left fallback
    return { position: 'fixed', top: Math.max(8, spotlight.top), right: windowW - spotlight.left + GAP, width: w };
}

export default function TutorialOverlay() {
    const { isActive, currentStep, step, totalSteps, nextStep, prevStep, skipTutorial } = useTutorial();
    const [targetRect, setTargetRect] = useState(null);
    const [winSize, setWinSize] = useState({ w: window.innerWidth, h: window.innerHeight });
    const [hasGoal, setHasGoal] = useState(false);

    useLayoutEffect(() => {
        if (!isActive) return;

        let inputEl = null;
        const handleInput = (e) => {
            if (currentStep?.id === 'goal-input') {
                setHasGoal(e.target.value.trim().length > 0);
            }
        };

        const update = () => {
            setWinSize({ w: window.innerWidth, h: window.innerHeight });
            if (!currentStep?.target) { setTargetRect(null); return; }
            const el = document.querySelector(`[data-tutorial="${currentStep.target}"]`);
            setTargetRect(el ? el.getBoundingClientRect() : null);

            if (currentStep.id === 'goal-input' && el) {
                const newInputEl = el.querySelector('input');
                if (newInputEl && newInputEl !== inputEl) {
                    if (inputEl) inputEl.removeEventListener('input', handleInput);
                    inputEl = newInputEl;
                    inputEl.addEventListener('input', handleInput);
                }
                if (inputEl) setHasGoal(inputEl.value.trim().length > 0);
            }
        };

        update();
        const observer = new MutationObserver(update);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
        window.addEventListener('resize', update);
        return () => { 
            observer.disconnect(); 
            window.removeEventListener('resize', update); 
            if (inputEl) inputEl.removeEventListener('input', handleInput);
        };
    }, [isActive, currentStep]);

    if (!isActive || !currentStep) return null;

    const { w, h } = winSize;
    const DIM = 'rgba(0,0,0,0.72)';

    const spotlight = targetRect ? {
        top:    Math.max(0, targetRect.top    - PADDING),
        left:   Math.max(0, targetRect.left   - PADDING),
        right:  Math.min(w, targetRect.right  + PADDING),
        bottom: Math.min(h, targetRect.bottom + PADDING),
    } : null;

    const tooltipStyle = getTooltipStyle(spotlight, w, h);
    const isLast = step >= totalSteps - 1;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9990, pointerEvents: 'none' }}>
            {/* Overlay quadrants */}
            {spotlight ? (
                <>
                    <div style={{ position:'fixed', top:0, left:0, right:0, height:spotlight.top, background:DIM, pointerEvents:'all' }} />
                    <div style={{ position:'fixed', top:spotlight.bottom, left:0, right:0, bottom:0, background:DIM, pointerEvents:'all' }} />
                    <div style={{ position:'fixed', top:spotlight.top, left:0, width:spotlight.left, height:spotlight.bottom-spotlight.top, background:DIM, pointerEvents:'all' }} />
                    <div style={{ position:'fixed', top:spotlight.top, left:spotlight.right, right:0, height:spotlight.bottom-spotlight.top, background:DIM, pointerEvents:'all' }} />
                    {/* Spotlight border */}
                    <div style={{ position:'fixed', top:spotlight.top, left:spotlight.left, width:spotlight.right-spotlight.left, height:spotlight.bottom-spotlight.top, border:'2px solid rgba(59,130,246,0.9)', borderRadius:10, boxShadow:'0 0 0 4px rgba(59,130,246,0.2)', pointerEvents:'none', zIndex:9992 }} />
                </>
            ) : (
                <div style={{ position:'fixed', inset:0, background:DIM, pointerEvents:'all' }} />
            )}

            {/* Tooltip card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep.id}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    style={{ ...tooltipStyle, zIndex: 9999, pointerEvents: 'all' }}
                    className="bg-gray-900 border border-blue-500/40 rounded-2xl shadow-2xl p-5"
                >
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
                            Step {step + 1} of {totalSteps}
                        </span>
                        <button onClick={skipTutorial} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                            Skip tour
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-white/10 rounded-full h-1 mb-4">
                        <div className="bg-blue-500 h-1 rounded-full transition-all duration-300" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
                    </div>

                    <h3 className="text-white font-bold text-sm mb-1.5">{currentStep.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">{currentStep.description}</p>

                    <div className="flex gap-2">
                        {step > 0 && (
                            <button onClick={prevStep} className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors">
                                Back
                            </button>
                        )}
                        {currentStep.id === 'clockin-btn' ? (
                            <div className="flex-[2] py-2 text-center text-blue-400 text-sm font-bold bg-blue-500/10 rounded-xl border border-blue-500/20">
                                Click 'Clock In' to Continue
                            </div>
                        ) : currentStep.id === 'goal-input' && !hasGoal ? (
                            <div className="flex-[2] py-2 text-center text-blue-400 text-sm font-bold bg-blue-500/10 rounded-xl border border-blue-500/20">
                                Type a goal to continue
                            </div>
                        ) : (
                            <button onClick={nextStep} className={`py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors ${step > 0 ? 'flex-[2]' : 'w-full'}`}>
                                {isLast ? "Let's Go! 🚀" : 'Next →'}
                            </button>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
