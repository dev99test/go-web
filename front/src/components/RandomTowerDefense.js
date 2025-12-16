import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import './RandomTowerDefense.css';
import {
  GRID_HEIGHT,
  GRID_WIDTH,
  PATH_TILES,
  initGame,
  rollTower,
  canPlace,
  startNextWave,
  tick,
  canMoveOrGameOver
} from './rt_d_rules';

const pathKeySet = new Set(PATH_TILES.map((p) => `${p[0]},${p[1]}`));

const reducer = (state, action) => {
  switch (action.type) {
    case 'RESET':
      return initGame();
    case 'ROLL_TOWER': {
      if (state.gold < 10 || state.pendingTower || state.gameOver) return state;
      return { ...state, gold: state.gold - 10, pendingTower: rollTower() };
    }
    case 'PLACE_TOWER': {
      if (!state.pendingTower) return state;
      const { x, y } = action.payload;
      if (!canPlace(state, x, y)) return state;
      const tower = {
        ...state.pendingTower,
        x,
        y,
        id: state.nextTowerId
      };
      return {
        ...state,
        towers: [...state.towers, tower],
        pendingTower: null,
        selectedTowerId: tower.id,
        nextTowerId: state.nextTowerId + 1
      };
    }
    case 'SELECT_TOWER':
      return { ...state, selectedTowerId: action.payload };
    case 'SELL_TOWER': {
      const targetId = state.selectedTowerId;
      if (!targetId) return state;
      const tower = state.towers.find((t) => t.id === targetId);
      if (!tower) return state;
      const refund = Math.round(tower.invested * 0.7);
      return {
        ...state,
        towers: state.towers.filter((t) => t.id !== targetId),
        selectedTowerId: null,
        gold: state.gold + refund
      };
    }
    case 'UPGRADE_TOWER': {
      const targetId = state.selectedTowerId;
      if (!targetId) return state;
      const towerIndex = state.towers.findIndex((t) => t.id === targetId);
      if (towerIndex === -1) return state;
      const tower = state.towers[towerIndex];
      const cost = 12 * tower.level;
      if (state.gold < cost) return state;
      const upgraded = {
        ...tower,
        level: tower.level + 1,
        invested: tower.invested + cost,
        damage: tower.damage * 1.12,
        range: tower.range + 0.1
      };
      const nextTowers = [...state.towers];
      nextTowers[towerIndex] = upgraded;
      return {
        ...state,
        towers: nextTowers,
        gold: state.gold - cost
      };
    }
    case 'SET_SPEED':
      return { ...state, speed: action.payload };
    case 'TOGGLE_PAUSE':
      if (state.gameOver) return state;
      return { ...state, paused: !state.paused, running: true };
    case 'START_WAVE':
      return startNextWave(state);
    case 'TICK':
      return tick(state, action.payload);
    case 'GAME_OVER_CHECK':
      return canMoveOrGameOver(state);
    default:
      return state;
  }
};

const RandomTowerDefense = () => {
  const [state, dispatch] = useReducer(reducer, undefined, initGame);
  const last = useRef(null);
  const animationRef = useRef(null);

  const boardCells = useMemo(
    () =>
      Array.from({ length: GRID_HEIGHT }, (_, y) =>
        Array.from({ length: GRID_WIDTH }, (_, x) => ({ x, y, isPath: pathKeySet.has(`${x},${y}`) }))
      ),
    []
  );

  useEffect(() => {
    const loop = (ts) => {
      if (last.current == null) {
        last.current = ts;
        animationRef.current = requestAnimationFrame(loop);
        return;
      }
      const deltaMs = ts - last.current;
      last.current = ts;
      dispatch({ type: 'TICK', payload: deltaMs / 1000 });
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    dispatch({ type: 'GAME_OVER_CHECK' });
  }, [state.life]);

  const pendingInfo = state.pendingTower ? (
    <div className="rtd-pending">
      <div className="rtd-slot">
        <span>대기 타워:</span>
        <span className="badge">{state.pendingTower.rarity}</span>
        <span>{state.pendingTower.type}</span>
      </div>
    </div>
  ) : (
    <div className="rtd-pending">대기 중인 타워가 없습니다.</div>
  );

  const selected = state.towers.find((t) => t.id === state.selectedTowerId);
  const canStartWave = !state.spawn.active && !state.gameOver;
  const canRoll = state.gold >= 10 && !state.pendingTower && !state.gameOver;

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>랜덤 타워 디펜스</h2>
      <p style={{ color: '#4b5563', marginTop: 0, marginBottom: 16 }}>
        고정된 길을 따라오는 적을 막기 위해 타워를 뽑고 배치하세요. 웨이브를 진행하며 골드를 모아 업그레이드할 수 있습니다.
      </p>
      <div className="rtd-container">
        <div className="rtd-board-wrapper">
          <div className="rtd-board">
            {boardCells.map((row, rowIdx) =>
              row.map((cell) => (
                <div
                  key={`${cell.x}-${cell.y}`}
                  className={`rtd-cell ${cell.isPath ? 'rtd-path' : ''}`}
                  onClick={() => dispatch({ type: 'PLACE_TOWER', payload: { x: cell.x, y: cell.y } })}
                  role="presentation"
                />
              ))
            )}
            <div className="rtd-overlay">
              {state.towers.map((tower) => (
                <div
                  key={tower.id}
                  className={`rtd-tower ${tower.id === state.selectedTowerId ? 'selected' : ''}`}
                  style={{
                    left: `${((tower.x + 0.5) / GRID_WIDTH) * 100}%`,
                    top: `${((tower.y + 0.5) / GRID_HEIGHT) * 100}%`,
                    background:
                      tower.rarity === 'Epic'
                        ? '#fbbf24'
                        : tower.rarity === 'Rare'
                        ? '#60a5fa'
                        : '#cbd5e1'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'SELECT_TOWER', payload: tower.id });
                  }}
                >
                  {tower.type[0]}
                </div>
              ))}
              {state.enemies.map((enemy) => {
                const idx = enemy.pathIndex;
                const current = PATH_TILES[idx];
                const next = PATH_TILES[idx + 1] ?? current;
                const x = current[0] + (next[0] - current[0]) * enemy.pathProgress;
                const y = current[1] + (next[1] - current[1]) * enemy.pathProgress;
                const hpRatio = Math.max(0, enemy.hp) / enemy.maxHp;
                return (
                  <div
                    key={enemy.id}
                    className="rtd-enemy"
                    style={{
                      left: `${((x + 0.5) / GRID_WIDTH) * 100}%`,
                      top: `${((y + 0.5) / GRID_HEIGHT) * 100}%`,
                      opacity: 0.7 + 0.3 * hpRatio
                    }}
                  >
                    {Math.max(1, Math.round(enemy.hp))}
                  </div>
                );
              })}
              {state.gameOver && <div className="rtd-gameover">Game Over</div>}
            </div>
          </div>
        </div>
        <div className="rtd-panel">
          <div className="rtd-row">
            <div>Wave</div>
            <div>{state.wave}</div>
          </div>
          <div className="rtd-row">
            <div>Life</div>
            <div className={state.life <= 5 ? 'rtd-status-bad' : 'rtd-status-good'}>{state.life}</div>
          </div>
          <div className="rtd-row">
            <div>Gold</div>
            <div>{state.gold}G</div>
          </div>
          <div className="rtd-row">
            <div>게임 속도</div>
            <div>
              <select
                value={state.speed}
                onChange={(e) => dispatch({ type: 'SET_SPEED', payload: Number(e.target.value) })}
                style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #1f2937' }}
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>
          </div>
          <div className="rtd-buttons">
            <button className="rtd-btn" onClick={() => dispatch({ type: 'RESET' })}>
              시작/재시작
            </button>
            <button className="rtd-btn secondary" onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })} disabled={!state.running || state.gameOver}>
              {state.paused ? '재개' : '일시정지'}
            </button>
            <button className="rtd-btn" onClick={() => dispatch({ type: 'START_WAVE' })} disabled={!canStartWave}>
              다음 웨이브
            </button>
          </div>
          <div className="rtd-buttons">
            <button className="rtd-btn" onClick={() => dispatch({ type: 'ROLL_TOWER' })} disabled={!canRoll}>
              타워 뽑기 (10G)
            </button>
          </div>
          {pendingInfo}
          {selected ? (
            <div style={{ padding: '10px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>선택된 타워</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="badge">{selected.rarity}</span>
                <span>{selected.type}</span>
                <span>Lv.{selected.level}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.4 }}>
                <div>공격력: {selected.damage.toFixed(1)}</div>
                <div>사거리: {selected.range.toFixed(1)}</div>
                <div>쿨다운: {selected.cooldown.toFixed(2)}s</div>
                {selected.splashRadius ? <div>스플래시: {selected.splashRadius.toFixed(1)} 타일</div> : null}
                {selected.slow ? <div>슬로우: {Math.round((1 - selected.slow.amount) * 100)}% / {selected.slow.duration.toFixed(1)}s</div> : null}
              </div>
              <div className="rtd-buttons" style={{ marginTop: 8 }}>
                <button
                  className="rtd-btn"
                  onClick={() => dispatch({ type: 'UPGRADE_TOWER' })}
                  disabled={state.gold < 12 * selected.level}
                >
                  업그레이드 ({12 * selected.level}G)
                </button>
                <button className="rtd-btn secondary" onClick={() => dispatch({ type: 'SELL_TOWER' })}>
                  판매
                </button>
              </div>
            </div>
          ) : (
            <div style={{ color: '#9ca3af' }}>타워를 클릭해 정보를 확인하세요.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RandomTowerDefense;
