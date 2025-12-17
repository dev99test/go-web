import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import './RandomTowerDefense.css';
import { GRID_HEIGHT, GRID_WIDTH, PATH_TILES } from './rt_d_rules';
import {
  initGameState,
  rollTower,
  placeTower,
  startWave,
  tickGame,
  upgradeTower,
  sellTower,
  mergeTowers
} from './gameEngine';

const pathKeySet = new Set(PATH_TILES.map((p) => `${p[0]},${p[1]}`));

const setSelectedTower = (state, playerId, towerId) => {
  const player = state.players[playerId];
  if (!player) return state;
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: { ...player, selectedTowerId: towerId }
    }
  };
};

const reducer = (state, action) => {
  const playerId = state.currentPlayerId;
  switch (action.type) {
    case 'RESET':
      return { ...initGameState(), mergeMode: false, mergeSourceTowerId: null, uiMessage: '' };
    case 'ROLL_TOWER':
      return rollTower(state, playerId);
    case 'PLACE_TOWER': {
      const { x, y } = action.payload;
      return placeTower(state, playerId, x, y);
    }
    case 'SELECT_TOWER':
      return { ...setSelectedTower(state, playerId, action.payload), uiMessage: '' };
    case 'SELL_TOWER': {
      const towerId = state.players[playerId].selectedTowerId;
      return { ...sellTower(state, playerId, towerId), mergeMode: false, mergeSourceTowerId: null };
    }
    case 'UPGRADE_TOWER': {
      const towerId = state.players[playerId].selectedTowerId;
      return upgradeTower(state, playerId, towerId);
    }
    case 'SET_SPEED':
      return { ...state, speed: action.payload };
    case 'TOGGLE_PAUSE':
      if (state.phase === 'GAME_OVER') return state;
      return { ...state, paused: !state.paused };
    case 'START_WAVE':
      return startWave(state, playerId);
    case 'TICK':
      return tickGame(state, action.payload);
    case 'START_MERGE_MODE': {
      const selectedId = state.players[playerId].selectedTowerId;
      if (!selectedId || state.phase === 'GAME_OVER') return state;
      return {
        ...state,
        mergeMode: true,
        mergeSourceTowerId: selectedId,
        uiMessage: '합성 모드: 대상 타워를 클릭하세요.'
      };
    }
    case 'CANCEL_MERGE_MODE':
      return { ...state, mergeMode: false, mergeSourceTowerId: null, uiMessage: '' };
    case 'MERGE_WITH_TARGET': {
      if (!state.mergeMode) return state;
      const { nextState, error, message } = mergeTowers(
        state,
        playerId,
        state.mergeSourceTowerId,
        action.payload
      );
      if (error) {
        return { ...nextState, mergeMode: true, mergeSourceTowerId: state.mergeSourceTowerId, uiMessage: error };
      }
      return { ...nextState, mergeMode: false, mergeSourceTowerId: null, uiMessage: message ?? '' };
    }
    default:
      return state;
  }
};

const RandomTowerDefense = () => {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => ({ ...initGameState(), mergeMode: false, mergeSourceTowerId: null, uiMessage: '' })
  );
  const last = useRef(null);
  const animationRef = useRef(null);
  const player = state.players[state.currentPlayerId];

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

  const pendingInfo = player.pendingTower ? (
    <div className="rtd-pending">
      <div>대기 타워: {player.pendingTower.type} ({player.pendingTower.rarity})</div>
      <div className="rtd-row" style={{ marginTop: 6 }}>
        <span>공격력: {player.pendingTower.damage.toFixed(1)}</span>
        <span>사거리: {player.pendingTower.range.toFixed(1)}</span>
      </div>
      {player.pendingTower.splashRadius ? <div>스플래시: {player.pendingTower.splashRadius.toFixed(1)} 타일</div> : null}
      {player.pendingTower.slow ? (
        <div>
          슬로우: {Math.round((1 - player.pendingTower.slow.amount) * 100)}% / {player.pendingTower.slow.duration.toFixed(1)}s
        </div>
      ) : null}
    </div>
  ) : (
    <div className="rtd-pending">대기 중인 타워가 없습니다.</div>
  );

  const selected = player.towers.find((t) => t.id === player.selectedTowerId);
  const canStartWave = !player.spawn.active && state.phase !== 'GAME_OVER';
  const canRoll = player.gold >= 10 && !player.pendingTower && state.phase !== 'GAME_OVER';
  const mergeCandidates = selected
    ? player.towers.filter(
        (t) => t.id !== selected.id && t.type === selected.type && t.level === selected.level && t.rarity === selected.rarity
      ).length
    : 0;

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>랜덤 타워 디펜스 (PvP 준비)</h2>
      <p style={{ color: '#4b5563', marginTop: 0, marginBottom: 16 }}>
        고정된 길을 따라오는 적을 막기 위해 타워를 뽑고 배치하세요. 현재는 1P 전용이지만, PvP 타입B 확장을 위한 로직 분리를 완료했습니다.
      </p>
      <div className="rtd-container">
        <div className="rtd-board-wrapper">
          <div className="rtd-board">
            {boardCells.map((row) =>
              row.map((cell) => (
                <div
                  key={`${cell.x}-${cell.y}`}
                  className={`rtd-cell ${cell.isPath ? 'rtd-path' : ''}`}
                  onClick={() => dispatch({ type: 'PLACE_TOWER', payload: { x: cell.x, y: cell.y } })}
                  role="presentation"
                />
              ))
            )}
            <div className="rtd-tower-layer">
              {player.towers.map((tower) => (
                <div
                  key={tower.id}
                  className={`rtd-tower ${tower.id === player.selectedTowerId ? 'selected' : ''}`}
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
                    if (state.mergeMode) {
                      dispatch({ type: 'MERGE_WITH_TARGET', payload: tower.id });
                    } else {
                      dispatch({ type: 'SELECT_TOWER', payload: tower.id });
                    }
                  }}
                >
                  {tower.type[0]}
                </div>
              ))}
            </div>
            <div className="rtd-overlay">
              {player.enemies.map((enemy) => {
                const idx = enemy.pathIndex;
                const current = PATH_TILES[idx];
                const next = PATH_TILES[idx + 1] ?? current;
                const x = current[0] + (next[0] - current[0]) * enemy.pathProgress;
                const y = current[1] + (next[1] - current[1]) * enemy.pathProgress;
                const hpRatio = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
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
                    <div className="rtd-hpbar">
                      <div className="rtd-hpbar-fill" style={{ width: `${hpRatio * 100}%` }} />
                    </div>
                  </div>
                );
              })}
              {state.phase === 'GAME_OVER' && <div className="rtd-gameover">Game Over</div>}
            </div>
          </div>
        </div>
        <div className="rtd-panel">
          <div className="rtd-row">
            <div>Wave</div>
            <div>{player.wave}</div>
          </div>
          <div className="rtd-row">
            <div>Life</div>
            <div className={player.life <= 5 ? 'rtd-status-bad' : 'rtd-status-good'}>{player.life}</div>
          </div>
          <div className="rtd-row">
            <div>Gold</div>
            <div>{player.gold}G</div>
          </div>
          <div className="rtd-row">
            <div>게임 속도</div>
            <div>
              <select
                value={state.speed}
                onChange={(e) => dispatch({ type: 'SET_SPEED', payload: Number(e.target.value) })}
                style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #1f2937' }}
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
              </select>
            </div>
          </div>
          <div className="rtd-buttons">
            <button className="rtd-btn" onClick={() => dispatch({ type: 'RESET' })}>
              시작/재시작
            </button>
            <button
              className="rtd-btn secondary"
              onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
              disabled={state.phase === 'GAME_OVER'}
            >
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
            <div style={{ padding: '10px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(195,255,255,0.08)' }}>
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
                  disabled={player.gold < 12 * selected.level}
                >
                  업그레이드 ({12 * selected.level}G)
                </button>
                <button className="rtd-btn secondary" onClick={() => dispatch({ type: 'SELL_TOWER' })}>
                  판매
                </button>
              </div>
              <div className="rtd-buttons" style={{ marginTop: 8 }}>
                <button
                  className="rtd-btn"
                  onClick={() => dispatch({ type: 'START_MERGE_MODE' })}
                  disabled={!selected || state.phase === 'GAME_OVER'}
                >
                  합성 모드 시작
                </button>
                {state.mergeMode ? (
                  <button className="rtd-btn secondary" onClick={() => dispatch({ type: 'CANCEL_MERGE_MODE' })}>
                    합성 취소
                  </button>
                ) : null}
              </div>
              <div style={{ marginTop: 6, color: '#e5e7eb', fontSize: 13 }}>
                합성 가능 대상: {mergeCandidates}개
              </div>
              {state.mergeMode ? (
                <div style={{ marginTop: 4, color: '#fbbf24', fontSize: 13 }}>합성 모드: 대상 타워를 클릭하세요.</div>
              ) : null}
            </div>
          ) : (
            <div style={{ color: '#9ca3af' }}>타워를 클릭해 정보를 확인하세요.</div>
          )}
          {state.uiMessage ? (
            <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', color: '#e5e7eb' }}>
              {state.uiMessage}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default RandomTowerDefense;
