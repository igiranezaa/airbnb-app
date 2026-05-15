import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { FaHeart, FaRegHeart, FaStar, FaMapMarkerAlt, FaTag, FaCheckCircle, FaArrowRight, FaPhone } from 'react-icons/fa';
import numeral from 'numeral';
import type { Listing } from '../types';
import { getFallbackPhoto } from '../utils/photos';
import styles from './ListingCard.module.css';

interface Props {
  listing: Listing;
  saved: boolean;
  onToggleSave: (id: string, title: string) => void;
  listMode?: boolean;
}

const ListingCard = memo(function ListingCard({ listing, saved, onToggleSave, listMode }: Props) {
  const navigate = useNavigate();
  const { id, title, location, price, rating, available, availableFrom, img } = listing;

  const reviewCount = Math.max(200, Math.floor(rating * 512));

  return (
    <motion.div
      className={clsx(styles.card, { [styles.listMode]: listMode, [styles.cardSaved]: saved })}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className={styles.imageWrapper}>
        <img
          src={img}
          alt={title}
          className={styles.image}
          onError={(e) => {
            e.currentTarget.src = getFallbackPhoto(listing.category);
          }}
        />

        <div className={styles.overlayBadges}>
          <span className={styles.featuredBadge}><FaStar /> Featured</span>
          <span className={styles.priceBadge}><FaTag /> {numeral(price).format('$0')} / night</span>
        </div>

        <button
          className={clsx(styles.heart, { [styles.heartActive]: saved })}
          onClick={(e) => { e.stopPropagation(); onToggleSave(id, title); }}
          aria-label={saved ? 'Unsave listing' : 'Save listing'}
        >
          {saved ? <FaHeart /> : <FaRegHeart />}
        </button>

        <button
          className={styles.actionBtn}
          onClick={() => navigate(`/listings/${id}`)}
          aria-label="View listing"
        >
          <FaArrowRight />
        </button>
      </div>

      <div className={styles.body} onClick={() => navigate(`/listings/${id}`)}>
        <p className={styles.rating}>
          <FaStar className={styles.star} />
          ({numeral(rating).format('0.00')}) {reviewCount.toLocaleString()} reviews
        </p>

        <h3 className={styles.title}>
          {title}
          {available && <FaCheckCircle className={styles.verified} />}
        </h3>

        <div className={styles.infoRow}>
          <span className={styles.infoItem}><FaPhone className={styles.infoIcon} /> {location}</span>
          <span className={styles.directionsLink}><FaMapMarkerAlt className={styles.infoIcon} /> Directions</span>
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
