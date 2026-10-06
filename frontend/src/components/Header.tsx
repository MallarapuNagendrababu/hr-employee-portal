import logo from '../assets/logo.jpeg';

type HeaderProps = {
  title: string;
};

export default function Header({ title }: HeaderProps) {
  return (
    <header className="portal-header">
      <div className="portal-brand">
        <img src={logo} alt="GloboWave" className="portal-logo" />
        <div className="portal-header-title">
          <h1>{title}</h1>
        </div>
      </div>
    </header>
  );
}


