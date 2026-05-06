import './Spinner.css';

export default function Spinner() {
  return (
    <div className="spinner-wrapper">
      <div className="spinner" role="status" aria-label="Loading" />
    </div>
  );
}
