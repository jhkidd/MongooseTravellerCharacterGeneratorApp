import { useMemo, useState } from 'react';
import { BackToHomeLink } from '../home/BackToHomeLink';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import {
  parseUwp,
  computePassengerModifier,
  getPassengerModifierBreakdown,
  rollPassengerTraffic,
  getPassageFare,
  computeFreightModifier,
  getFreightModifierBreakdown,
  rollFreightTraffic,
  rollLotTonnage,
  getLotTonnageDiceLabel,
  getFreightRate,
  computeMailModifier,
  getMailModifierBreakdown,
  rollMailAvailable,
  rollMailContainers,
  MAIL_CONTAINER_TONS,
  MAIL_CONTAINER_PAYMENT,
  rollAvailableGoods,
  computePurchaseModifier,
  getPurchaseModifierBreakdown,
  computeSaleModifier,
  getSaleModifierBreakdown,
  rollPurchasePrice,
  rollSalePrice,
  combineTravelZones,
} from '../../engine/trade-calculator';
import type { DmComponent } from '../../engine/trade-calculator';
import type { AvailableGood, FreightLotSize, ParsedWorld, PassengerClass, SpeculativeMode } from '../../models/trade';
import './TradePage.css';

type Tab = 'passengers' | 'freight' | 'speculative';

const PASSENGER_CLASSES: PassengerClass[] = ['High', 'Middle', 'Basic', 'Low'];
const LOT_SIZES: FreightLotSize[] = ['Major', 'Minor', 'Incidental'];

function useParsedWorld(input: string): ParsedWorld | null {
  return useMemo(() => (input.trim() ? parseUwp(input) : null), [input]);
}

export function TradePage() {
  const [sourceInput, setSourceInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [brokerSkill, setBrokerSkill] = useState(0);
  const [stewardSkill, setStewardSkill] = useState(0);
  const [parsecs, setParsecs] = useState(1);
  const [tab, setTab] = useState<Tab>('passengers');

  const sourceWorld = useParsedWorld(sourceInput);
  const destWorld = useParsedWorld(destInput);

  return (
    <div className="trade-page">
      <BackToHomeLink />

      <div className="trade-page__hero">
        <div className="trade-page__hero-copy">
          <p className="trade-page__eyebrow">Commerce &amp; Logistics</p>
          <ChamferedHeader level={1}>Trade</ChamferedHeader>
          <p className="trade-page__subtitle">
            Work out passengers, freight and speculative cargo between two worlds. Roll the dice
            automatically, or type in results if you're playing at the table with physical dice.
          </p>
        </div>
      </div>

      <section className="trade-page__section trade-page__section--header">
        <ChamferedHeader level={3}>Route</ChamferedHeader>
        <div className="trade-page__header-grid">
          <UwpField label="Source World UWP" value={sourceInput} onChange={setSourceInput} world={sourceWorld} />
          <UwpField label="Destination World UWP" value={destInput} onChange={setDestInput} world={destWorld} />
          <label className="trade-page__field">
            <span>Broker Skill</span>
            <input type="number" value={brokerSkill} onChange={(e) => setBrokerSkill(Number(e.target.value))} />
          </label>
          <label className="trade-page__field">
            <span>Steward Skill</span>
            <input type="number" value={stewardSkill} onChange={(e) => setStewardSkill(Number(e.target.value))} />
          </label>
          <label className="trade-page__field">
            <span>Parsecs Travelled</span>
            <input type="number" min={1} max={6} value={parsecs} onChange={(e) => setParsecs(Number(e.target.value))} />
          </label>
        </div>
      </section>

      <div className="trade-page__tabs">
        <button type="button" className={`trade-page__tab ${tab === 'passengers' ? 'trade-page__tab--active' : ''}`} onClick={() => setTab('passengers')}>
          Passengers
        </button>
        <button type="button" className={`trade-page__tab ${tab === 'freight' ? 'trade-page__tab--active' : ''}`} onClick={() => setTab('freight')}>
          Freight &amp; Mail
        </button>
        <button type="button" className={`trade-page__tab ${tab === 'speculative' ? 'trade-page__tab--active' : ''}`} onClick={() => setTab('speculative')}>
          Speculative Trade
        </button>
      </div>

      {tab === 'passengers' && (
        <PassengersTab sourceWorld={sourceWorld} destWorld={destWorld} stewardSkill={stewardSkill} parsecs={parsecs} />
      )}
      {tab === 'freight' && (
        <FreightMailTab sourceWorld={sourceWorld} destWorld={destWorld} parsecs={parsecs} />
      )}
      {tab === 'speculative' && (
        <SpeculativeTradeTab sourceWorld={sourceWorld} destWorld={destWorld} brokerSkill={brokerSkill} />
      )}
    </div>
  );
}

function UwpField({
  label,
  value,
  onChange,
  world,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  world: ParsedWorld | null;
}) {
  return (
    <label className="trade-page__field trade-page__field--uwp">
      <span>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Regina 1910 C875A97-A Ri Pa Ph"
      />
      {value.trim() && (
        world
          ? <span className="trade-page__uwp-status trade-page__uwp-status--ok">
              Parsed: Starport {world.starport}, Pop {world.population.toString(16).toUpperCase()}, TL{world.techLevel.toString(16).toUpperCase()}
              {world.travelZone ? `, ${world.travelZone} Zone` : ''}
            </span>
          : <span className="trade-page__uwp-status trade-page__uwp-status--error">Couldn't find a UWP profile in that text.</span>
      )}
    </label>
  );
}

function NeedsWorlds({ sourceWorld, destWorld }: { sourceWorld: ParsedWorld | null; destWorld: ParsedWorld | null }) {
  if (sourceWorld && destWorld) return null;
  return (
    <p className="trade-page__empty-state">
      Enter and parse both a source and destination world UWP above to use this calculator.
    </p>
  );
}

// --- Passengers Tab ---

interface RolledCount {
  count: number;
  manual: boolean;
}

function PassengersTab({
  sourceWorld,
  destWorld,
  stewardSkill,
  parsecs,
}: {
  sourceWorld: ParsedWorld | null;
  destWorld: ParsedWorld | null;
  stewardSkill: number;
  parsecs: number;
}) {
  const [skillEffect, setSkillEffect] = useState(0);
  const [results, setResults] = useState<Partial<Record<PassengerClass, RolledCount>>>({});

  if (!sourceWorld || !destWorld) return <NeedsWorlds sourceWorld={sourceWorld} destWorld={destWorld} />;

  function paramsFor(passengerClass: PassengerClass) {
    return {
      passengerClass,
      skillEffect,
      stewardSkill,
      sourcePopulation: sourceWorld!.population,
      destPopulation: destWorld!.population,
      sourceStarport: sourceWorld!.starport,
      destStarport: destWorld!.starport,
      travelZone: combineTravelZones(sourceWorld!.travelZone, destWorld!.travelZone),
      parsecs,
    };
  }

  function modifierFor(passengerClass: PassengerClass) {
    return computePassengerModifier(paramsFor(passengerClass));
  }

  function handleRoll(passengerClass: PassengerClass) {
    const count = rollPassengerTraffic(modifierFor(passengerClass));
    setResults((prev) => ({ ...prev, [passengerClass]: { count, manual: false } }));
  }

  function handleManualChange(passengerClass: PassengerClass, count: number) {
    setResults((prev) => ({ ...prev, [passengerClass]: { count, manual: true } }));
  }

  return (
    <section className="trade-page__section">
      <ChamferedHeader level={3}>Passenger Traffic</ChamferedHeader>
      <label className="trade-page__field trade-page__field--inline">
        <span>Broker/Streetwise Check Effect</span>
        <input type="number" value={skillEffect} onChange={(e) => setSkillEffect(Number(e.target.value))} />
      </label>

      <div className="trade-page__card-row">
        {PASSENGER_CLASSES.map((passengerClass) => {
          const result = results[passengerClass];
          const fare = getPassageFare(parsecs, passengerClass);
          const total = (result?.count ?? 0) * fare;
          return (
            <div className="trade-page__card" key={passengerClass}>
              <h4>{passengerClass} Passage</h4>
              <DmBreakdown
                diceLabel="2D6"
                total={modifierFor(passengerClass)}
                items={getPassengerModifierBreakdown(paramsFor(passengerClass))}
              />
              <p className="trade-page__stat-line">Fare: Cr{fare.toLocaleString()}</p>
              <div className="trade-page__roll-row">
                <button type="button" className="trade-page__button trade-page__button--secondary" onClick={() => handleRoll(passengerClass)}>
                  Roll Traffic
                </button>
                <input
                  type="number"
                  min={0}
                  value={result?.count ?? ''}
                  placeholder="0"
                  onChange={(e) => handleManualChange(passengerClass, Number(e.target.value))}
                />
                <span>passengers</span>
              </div>
              {result && <p className="trade-page__result">Total fares: Cr{total.toLocaleString()}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// --- Freight & Mail Tab ---

function FreightMailTab({
  sourceWorld,
  destWorld,
  parsecs,
}: {
  sourceWorld: ParsedWorld | null;
  destWorld: ParsedWorld | null;
  parsecs: number;
}) {
  const [skillEffect, setSkillEffect] = useState(0);
  const [lots, setLots] = useState<Partial<Record<FreightLotSize, RolledCount>>>({});
  const [tonnage, setTonnage] = useState<Partial<Record<FreightLotSize, number>>>({});

  const [shipArmed, setShipArmed] = useState(false);
  const [socDm, setSocDm] = useState(0);
  const [navalOrScoutRank, setNavalOrScoutRank] = useState(0);
  const [mailAvailable, setMailAvailable] = useState<boolean | null>(null);
  const [mailContainers, setMailContainers] = useState<number | null>(null);

  if (!sourceWorld || !destWorld) return <NeedsWorlds sourceWorld={sourceWorld} destWorld={destWorld} />;

  function paramsFor(lotSize: FreightLotSize) {
    return {
      lotSize,
      skillEffect,
      sourcePopulation: sourceWorld!.population,
      destPopulation: destWorld!.population,
      sourceStarport: sourceWorld!.starport,
      destStarport: destWorld!.starport,
      techLevel: destWorld!.techLevel,
      travelZone: combineTravelZones(sourceWorld!.travelZone, destWorld!.travelZone),
      parsecs,
    };
  }

  function modifierFor(lotSize: FreightLotSize) {
    return computeFreightModifier(paramsFor(lotSize));
  }

  function handleRollLots(lotSize: FreightLotSize) {
    const count = rollFreightTraffic(modifierFor(lotSize));
    setLots((prev) => ({ ...prev, [lotSize]: { count, manual: false } }));
  }

  function handleManualLots(lotSize: FreightLotSize, count: number) {
    setLots((prev) => ({ ...prev, [lotSize]: { count, manual: true } }));
  }

  function handleRollTonnage(lotSize: FreightLotSize) {
    setTonnage((prev) => ({ ...prev, [lotSize]: rollLotTonnage(lotSize) }));
  }

  function handleManualTonnage(lotSize: FreightLotSize, tons: number) {
    setTonnage((prev) => ({ ...prev, [lotSize]: tons }));
  }

  const freightRate = getFreightRate(parsecs);
  const majorModifier = modifierFor('Major');

  const mailModifierParams = {
    freightTrafficDM: majorModifier,
    shipArmed,
    techLevel: destWorld.techLevel,
    socDm,
    navalOrScoutRank,
  };
  const mailModifier = computeMailModifier(mailModifierParams);

  function handleRollMailAvailable() {
    setMailAvailable(rollMailAvailable(mailModifier));
  }

  function handleRollMailContainers() {
    setMailContainers(rollMailContainers());
  }

  return (
    <>
      <section className="trade-page__section">
        <ChamferedHeader level={3}>Freight Traffic</ChamferedHeader>
        <label className="trade-page__field trade-page__field--inline">
          <span>Broker Check Effect</span>
          <input type="number" value={skillEffect} onChange={(e) => setSkillEffect(Number(e.target.value))} />
        </label>

        <div className="trade-page__card-row">
          {LOT_SIZES.map((lotSize) => {
            const lotResult = lots[lotSize];
            const tons = tonnage[lotSize];
            return (
              <div className="trade-page__card" key={lotSize}>
                <h4>{lotSize} Lots</h4>
                <DmBreakdown diceLabel="2D6" total={modifierFor(lotSize)} items={getFreightModifierBreakdown(paramsFor(lotSize))} />
                <div className="trade-page__roll-row">
                  <button type="button" className="trade-page__button trade-page__button--secondary" onClick={() => handleRollLots(lotSize)}>
                    Roll Lots
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={lotResult?.count ?? ''}
                    placeholder="0"
                    onChange={(e) => handleManualLots(lotSize, Number(e.target.value))}
                  />
                  <span>lots available</span>
                </div>
                <p className="trade-page__stat-line">Tonnage roll: {getLotTonnageDiceLabel(lotSize)}</p>
                <div className="trade-page__roll-row">
                  <button type="button" className="trade-page__button trade-page__button--secondary" onClick={() => handleRollTonnage(lotSize)}>
                    Roll Tonnage
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={tons ?? ''}
                    placeholder="0"
                    onChange={(e) => handleManualTonnage(lotSize, Number(e.target.value))}
                  />
                  <span>tons/lot</span>
                </div>
                {tons != null && (
                  <p className="trade-page__result">
                    Freight rate: Cr{freightRate.toLocaleString()}/ton &mdash; Cr{(tons * freightRate).toLocaleString()}/lot
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="trade-page__section">
        <ChamferedHeader level={3}>Mail</ChamferedHeader>
        <div className="trade-page__header-grid">
          <label className="trade-page__field trade-page__field--checkbox">
            <input type="checkbox" checked={shipArmed} onChange={(e) => setShipArmed(e.target.checked)} />
            <span>Ship is Armed</span>
          </label>
          <label className="trade-page__field">
            <span>Social Standing DM</span>
            <input type="number" value={socDm} onChange={(e) => setSocDm(Number(e.target.value))} />
          </label>
          <label className="trade-page__field">
            <span>Naval/Scout Rank DM</span>
            <input type="number" value={navalOrScoutRank} onChange={(e) => setNavalOrScoutRank(Number(e.target.value))} />
          </label>
        </div>
        <DmBreakdown diceLabel="2D6 (need 12+)" total={mailModifier} items={getMailModifierBreakdown(mailModifierParams)} />
        <div className="trade-page__roll-row">
          <button type="button" className="trade-page__button trade-page__button--secondary" onClick={handleRollMailAvailable}>
            Roll Mail Available
          </button>
          <label className="trade-page__field trade-page__field--checkbox">
            <input
              type="checkbox"
              checked={mailAvailable ?? false}
              onChange={(e) => setMailAvailable(e.target.checked)}
            />
            <span>Mail available</span>
          </label>
        </div>
        {mailAvailable && (
          <div className="trade-page__roll-row">
            <span className="trade-page__stat-line">Roll 1D6</span>
            <button type="button" className="trade-page__button trade-page__button--secondary" onClick={handleRollMailContainers}>
              Roll Containers
            </button>
            <input
              type="number"
              min={0}
              value={mailContainers ?? ''}
              placeholder="0"
              onChange={(e) => setMailContainers(Number(e.target.value))}
            />
            <span>containers</span>
          </div>
        )}
        {mailAvailable && mailContainers != null && (
          <p className="trade-page__result">
            {mailContainers} container{mailContainers === 1 ? '' : 's'} &mdash; {mailContainers * MAIL_CONTAINER_TONS} tons,
            Cr{(mailContainers * MAIL_CONTAINER_PAYMENT).toLocaleString()} total
          </p>
        )}
      </section>
    </>
  );
}

// --- Speculative Trade Tab ---

function SpeculativeTradeTab({
  sourceWorld,
  destWorld,
  brokerSkill,
}: {
  sourceWorld: ParsedWorld | null;
  destWorld: ParsedWorld | null;
  brokerSkill: number;
}) {
  const [mode, setMode] = useState<SpeculativeMode>('legal');
  const [goods, setGoods] = useState<AvailableGood[]>([]);
  const [purchaseResults, setPurchaseResults] = useState<Record<string, { roll: number; price: number }>>({});
  const [saleResults, setSaleResults] = useState<Record<string, { roll: number; price: number }>>({});
  const [counterpartyBrokerSkill, setCounterpartyBrokerSkill] = useState(0);

  if (!sourceWorld || !destWorld) return <NeedsWorlds sourceWorld={sourceWorld} destWorld={destWorld} />;

  function handleRollGoods() {
    setGoods(rollAvailableGoods(sourceWorld!.population, sourceWorld!.tradeCodes.map((tc) => tc.code), mode));
    setPurchaseResults({});
    setSaleResults({});
  }

  function purchaseParams(good: AvailableGood) {
    return {
      good: good.definition,
      brokerSkill,
      counterpartyBrokerSkill,
      tradeCodes: sourceWorld!.tradeCodes.map((tc) => tc.code),
      travelZone: sourceWorld!.travelZone,
    };
  }

  function saleParams(good: AvailableGood) {
    return {
      good: good.definition,
      brokerSkill,
      counterpartyBrokerSkill,
      tradeCodes: destWorld!.tradeCodes.map((tc) => tc.code),
      travelZone: destWorld!.travelZone,
    };
  }

  function handlePurchase(good: AvailableGood) {
    const result = rollPurchasePrice(purchaseParams(good));
    setPurchaseResults((prev) => ({ ...prev, [good.definition.d66]: result }));
  }

  function handleSale(good: AvailableGood) {
    const result = rollSalePrice(saleParams(good));
    setSaleResults((prev) => ({ ...prev, [good.definition.d66]: result }));
  }

  return (
    <section className="trade-page__section">
      <ChamferedHeader level={3}>Speculative Cargo</ChamferedHeader>
      <div className="trade-page__header-grid">
        <label className="trade-page__field">
          <span>Supplier Type</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as SpeculativeMode)}>
            <option value="legal">Legal Broker</option>
            <option value="blackMarket">Black Market</option>
          </select>
        </label>
        <label className="trade-page__field">
          <span>Counterparty Broker Skill</span>
          <input type="number" value={counterpartyBrokerSkill} onChange={(e) => setCounterpartyBrokerSkill(Number(e.target.value))} />
        </label>
      </div>
      <div className="trade-page__form-actions">
        <button type="button" className="trade-page__button" onClick={handleRollGoods}>
          Roll Available Goods
        </button>
      </div>

      {goods.length === 0 ? (
        <p className="trade-page__empty-state">No goods rolled yet.</p>
      ) : (
        <table className="trade-page__goods-table">
          <thead>
            <tr>
              <th>Good</th>
              <th>Tons</th>
              <th>Base Price</th>
              <th>Purchase</th>
              <th>Sale</th>
            </tr>
          </thead>
          <tbody>
            {goods.map((good) => {
              const purchase = purchaseResults[good.definition.d66];
              const sale = saleResults[good.definition.d66];
              return (
                <tr key={good.definition.d66}>
                  <td>
                    {good.definition.name}
                    {good.definition.illegal && <span className="trade-page__chip trade-page__chip--illegal">Illegal</span>}
                    <p className="trade-page__examples">{good.definition.examples}</p>
                  </td>
                  <td>{good.tons}</td>
                  <td>Cr{good.definition.basePrice.toLocaleString()}</td>
                  <td>
                    <p className="trade-page__stat-line trade-page__stat-line--compact">
                      Roll 3D6 {formatDm(computePurchaseModifier(purchaseParams(good)))}
                      {(() => {
                        const breakdown = formatDmBreakdown(getPurchaseModifierBreakdown(purchaseParams(good)));
                        return breakdown ? ` (${breakdown})` : '';
                      })()}
                    </p>
                    <button type="button" className="trade-page__button trade-page__button--secondary" onClick={() => handlePurchase(good)}>
                      Roll Purchase
                    </button>
                    {purchase && <p className="trade-page__result">3D {purchase.roll}: Cr{purchase.price.toLocaleString()}/ton</p>}
                  </td>
                  <td>
                    <p className="trade-page__stat-line trade-page__stat-line--compact">
                      Roll 3D6 {formatDm(computeSaleModifier(saleParams(good)))}
                      {(() => {
                        const breakdown = formatDmBreakdown(getSaleModifierBreakdown(saleParams(good)));
                        return breakdown ? ` (${breakdown})` : '';
                      })()}
                    </p>
                    <button type="button" className="trade-page__button trade-page__button--secondary" onClick={() => handleSale(good)}>
                      Roll Sale
                    </button>
                    {sale && <p className="trade-page__result">3D {sale.roll}: Cr{sale.price.toLocaleString()}/ton</p>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

function formatDm(dm: number): string {
  return dm >= 0 ? `+${dm}` : `${dm}`;
}

/** Renders a roll's dice notation and total DM, plus a bulleted list of the non-zero DMs behind it. */
function DmBreakdown({ diceLabel, total, items }: { diceLabel: string; total: number; items: DmComponent[] }) {
  return (
    <div className="trade-page__dm-block">
      <p className="trade-page__stat-line">
        Roll {diceLabel} {formatDm(total)}
      </p>
      {items.length > 0 && (
        <ul className="trade-page__dm-list">
          {items.map((item) => (
            <li key={item.label}>
              {item.label}: {formatDm(item.value)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Compact comma-separated rendering of a DM breakdown, for tight spaces like table cells. */
function formatDmBreakdown(items: DmComponent[]): string {
  return items.map((item) => `${item.label} ${formatDm(item.value)}`).join(', ');
}
