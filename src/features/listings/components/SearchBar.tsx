import { useEffect, useMemo, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { useStore } from '../../../store/StoreContext';

export default function SearchBar() {
  const { dispatch } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const debouncedDispatch = useMemo(
    () =>
      debounce((value: string) => {
        dispatch({ type: 'SET_FILTER', payload: value });
      }, 300),
    [dispatch]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalValue(e.target.value);
    debouncedDispatch(e.target.value);
  }

  return (
    <label className="search-bar">
      <input
        ref={inputRef}
        className="search-bar__input"
        type="text"
        placeholder="Search listings..."
        value={localValue}
        onChange={handleChange}
      />
    </label>
  );
}
