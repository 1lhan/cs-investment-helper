export default function HeaderWithIcon({ title, iconClass, size = 'large' }) {
    return (
        <div className={'header-with-icon' + (size == 'medium' ? ' medium' : '')}>
            <div className="icon-background">
                <i className={iconClass} />
            </div>
            <span>{title}</span>
        </div>
    )
}