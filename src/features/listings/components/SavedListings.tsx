import { Transition } from '@headlessui/react';
import numeral from 'numeral';
import { useStore } from '../../../store/StoreContext';
import { useListings } from '../hooks/useListings';
import { List } from '../../../shared/components/List';
import type { Listing } from '../types';
import './SavedListings.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SavedListings({ open, onClose }: Props) {
  const { state } = useStore();
  const { data: allListings = [] } = useListings();
  const savedListings = allListings.filter((l) => state.saved.includes(l.id));

  return (
    <>
      <Transition show={open}>
        <div className="saved-panel-backdrop" onClick={onClose} />
      </Transition>

      <Transition show={open}>
        <div className="saved-panel">
          <div className="saved-panel__header">
            <h2 className="saved-panel__title">Saved Listings</h2>
            <button className="saved-panel__close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          <List<Listing>
            items={savedListings}
            keyExtractor={(l) => l.id}
            emptyMessage="No listings saved yet."
            className="saved-panel__list"
            renderItem={(l) => (
              <div className="saved-panel__item">
                <img src={l.img} alt={l.title} className="saved-panel__thumb" />
                <div className="saved-panel__info">
                  <p className="saved-panel__item-title">{l.title}</p>
                  <p className="saved-panel__item-location">{l.location}</p>
                  <p className="saved-panel__item-price">
                    {numeral(l.price).format('$0')} / night
                  </p>
                </div>
              </div>
            )}
          />
        </div>
      </Transition>
    </>
  );
}
