export default function SkeletonCard() {
    return (
        <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '3/4',
            maxHeight: '600px',
            borderRadius: '40px',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
        }}>
            {/* Shimmer overlay */}
            <div className="shimmer" style={{ position: 'absolute', inset: 0 }} />

            {/* Background gradient */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.8) 100%)',
            }} />

            {/* Animated pulse rings in center */}
            <div style={{
                position: 'absolute', top: '40%', left: '50%',
                transform: 'translate(-50%, -50%)',
            }}>
                <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'rgba(29,185,84,0.08)',
                    border: '1px solid rgba(29,185,84,0.15)',
                    animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: 'rgba(29,185,84,0.3)',
                    }} />
                </div>
            </div>

            {/* Bottom skeleton */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 28px 28px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <div style={{
                        height: '28px', borderRadius: '8px',
                        background: 'rgba(255,255,255,0.07)',
                        width: '70%', marginBottom: '12px',
                    }} />
                    <div style={{
                        height: '12px', borderRadius: '4px',
                        background: 'rgba(255,255,255,0.04)',
                        width: '35%',
                    }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '18px',
                        background: 'rgba(255,255,255,0.07)', flexShrink: 0,
                    }} />
                    <div style={{
                        flex: 1, height: '3px', borderRadius: '9999px',
                        background: 'rgba(255,255,255,0.05)',
                    }} />
                </div>
            </div>
        </div>
    );
}
