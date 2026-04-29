'use client';

import Image from 'next/image';
import React from 'react';
import BrandButton from '@/components/shared/BrandButton';
import styles from './HomeHero.module.scss';

interface HomeHeroProps {
  variantCountLabel: string;
  onCreateVariantClick: () => void;
}

const COMPACT_RULES = [
  { power: 15, suffix: 'квдрлн' },
  { power: 12, suffix: 'трлн' },
  { power: 9, suffix: 'млрд' },
  { power: 6, suffix: 'млн' },
  { power: 3, suffix: 'тыс' },
] as const;

const incrementNumericString = (source: string) => {
  let carry = 1;
  const chars = source.split('');

  for (let index = chars.length - 1; index >= 0; index -= 1) {
    if (carry === 0) break;

    const nextDigit = Number(chars[index] || '0') + carry;
    chars[index] = String(nextDigit % 10);
    carry = nextDigit >= 10 ? 1 : 0;
  }

  if (carry > 0) {
    chars.unshift('1');
  }

  return chars.join('');
};

const formatCompactFromDigits = (rawDigits: string) => {
  const normalizedDigits = rawDigits.replace(/^0+/, '') || '0';

  for (let index = 0; index < COMPACT_RULES.length; index += 1) {
    const rule = COMPACT_RULES[index];
    if (normalizedDigits.length <= rule.power) continue;

    const splitIndex = normalizedDigits.length - rule.power;
    let integerPart = normalizedDigits.slice(0, splitIndex);

    const firstDecimalDigit = Number(normalizedDigits[splitIndex] || '0');
    const secondDecimalDigit = Number(normalizedDigits[splitIndex + 1] || '0');

    let decimalPart = firstDecimalDigit;
    if (secondDecimalDigit >= 5) {
      decimalPart += 1;
    }

    if (decimalPart === 10) {
      integerPart = incrementNumericString(integerPart);
      decimalPart = 0;
    }

    if (integerPart === '1000' && index > 0) {
      return `1 ${COMPACT_RULES[index - 1].suffix}`;
    }

    return decimalPart === 0
      ? `${integerPart} ${rule.suffix}`
      : `${integerPart},${decimalPart} ${rule.suffix}`;
  }

  return null;
};

export default function HomeHero({
  variantCountLabel,
  onCreateVariantClick,
}: HomeHeroProps) {
  const normalizedNumber = React.useMemo(() => {
    const digits = variantCountLabel.replace(/[^\d]/g, '');
    if (!digits) return variantCountLabel;

    return formatCompactFromDigits(digits) ?? variantCountLabel;
  }, [variantCountLabel]);

  return (
    <section className={styles.hero}>
      <div className={styles.wordmarkBlock}>
        <Image
          src="/E.svg"
          alt=""
          width={251}
          height={308}
          className={styles.decorPrimary}
        />
        <Image
          src="/GE.svg"
          alt=""
          width={437}
          height={312}
          className={styles.decorSecondary}
        />
        <Image
          src="/hero_text.svg"
          alt="КРИЦКИЙ"
          width={1125}
          height={211}
          className={styles.wordmark}
          priority
        />
        <Image
          src="/upper_i.svg"
          alt=""
          width={32}
          height={10}
          className={styles.wordmarkAccent}
        />
      </div>

      <div className={styles.featuresDesktop}>
        <p className={styles.featureLeft}>
          Профессиональный
          <br />
          конструктор ЕГЭ по литературе
          <br />
          для учителей и репетиторов
        </p>
        <span className={styles.separatorVertical} aria-hidden="true" />
        <p className={styles.featureCenter}>
          База актуальных заданий,
          <br />
          более миллиона уникальных
          <br />
          авторских вариантов
        </p>
        <span className={styles.separatorVertical} aria-hidden="true" />
        <p className={styles.featureRight}>
          Мгновенная
          <br />
          подготовка материалов
          <br />к скачиванию и печати
        </p>
      </div>

      <div className={styles.featuresMobile}>
        <p>
          Профессиональный конструктор ЕГЭ по литературе для учителей и
          репетиторов
        </p>
        <span className={styles.separatorHorizontal} aria-hidden="true" />
        <p>
          База актуальных заданий, более миллиона уникальных авторских вариантов
        </p>
        <span className={styles.separatorHorizontal} aria-hidden="true" />
        <p>Мгновенная подготовка материалов к скачиванию и печати</p>
      </div>

      <div className={styles.actions}>
        <BrandButton
          variant="accent"
          size="xl"
          className={styles.createButton}
          onClick={onCreateVariantClick}
          caps
        >
          Создать вариант
        </BrandButton>
        <div className={styles.statsBadge}>
          <span className={styles.statsPrefix}>Сейчас доступно:</span>
          <span className={styles.statsValue}>{normalizedNumber}</span>
          <span className={styles.statsSuffix}>вариантов заданий</span>
        </div>
      </div>
    </section>
  );
}
