import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { FaHeart, FaRegHeart, FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import numeral from 'numeral';
import type { Listing } from '../types';
import styles from './ListingCard.module.css';

interface Props {
  listing: Listing;
  saved: boolean;
  onToggleSave: (id: number, title: string) => void;
}

const ListingCard = memo(function ListingCard({ listing, saved, onToggleSave }: Props) {
  const navigate = useNavigate();
  const { id, title, location, price, rating, superhost, available, availableFrom, img } = listing;

  return (
    <motion.div
      className={clsx(styles.card, {
        [styles.cardSaved]: saved,
        [styles.cardLuxury]: price > 300,
        [styles.cardBooked]: !available,
        [styles.cardSuperhost]: superhost,
      })}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      onClick={() => navigate(`/listings/${id}`)}
    >
      <div className={styles.imageWrapper}>
        <img src={img} alt={title} className={styles.image} />

        <div className={styles.overlayBadges}>
          {superhost && (
            <span className={styles.superhostBadge}>Superhost</span>
          )}
          {price > 300 && (
            <span className={styles.luxuryBadge}>Luxury</span>
          )}
        </div>

        <button
          className={clsx(styles.heart, { [styles.heartActive]: saved })}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(id, title);
          }}
          aria-label={saved ? 'Unsave listing' : 'Save listing'}
        >
          {saved ? <FaHeart /> : <FaRegHeart />}
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.topRow}>
          <p className={styles.rating}>
            <FaStar className={styles.star} />
            {numeral(rating).format('0.00')}
          </p>
          <span className={clsx(styles.status, {
            [styles.statusAvailable]: available,
            [styles.statusBooked]: !available,
          })}>
            {available ? 'Available' : 'Booked'}
          </span>
        </div>

        <h3 className={styles.title}>{title}</h3>

        <div className={styles.locationRow}>
          <FaMapMarkerAlt className={styles.pin} />
          <span>{location}</span>
        </div>

        <div className={styles.footer}>
          <span className={styles.price}>
            {numeral(price).format('$0')} <small>/ night</small>
          </span>
          <span className={styles.date}>
            From {format(parseISO(availableFrom), 'MMM d, yyyy')}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

export default ListingCard;
