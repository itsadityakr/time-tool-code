import React, { useEffect, useRef } from "react";

/**
 * Custom cursor follower component for enhanced UX
 */
const CursorFollower = () => {
    const cursorRef = useRef(null);
    const followerRef = useRef(null);

    useEffect(() => {
        const moveCursor = (e) => {
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            }
            if (followerRef.current) {
                setTimeout(() => {
                    if (followerRef.current)
                        followerRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
                }, 80);
            }
        };

        window.addEventListener("mousemove", moveCursor);
        return () => window.removeEventListener("mousemove", moveCursor);
    }, []);

    return (
        <>
            <div
                ref={cursorRef}
                className="fixed top-0 left-0 w-3 h-3 bg-white rounded-full mix-blend-difference pointer-events-none z-[9999] -mt-1.5 -ml-1.5 transition-transform duration-75 ease-out will-change-transform hidden md:block"
            />
            <div
                ref={followerRef}
                className="fixed top-0 left-0 w-8 h-8 border border-white/50 rounded-full mix-blend-difference pointer-events-none z-[9998] -mt-4 -ml-4 transition-transform duration-300 ease-out will-change-transform hidden md:block"
            />
        </>
    );
};

export default CursorFollower;
