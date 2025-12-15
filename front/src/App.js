import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:8080/api';

function App() {
  const [helloMessage, setHelloMessage] = useState('로딩 중...');
  const [name, setName] = useState('');
  const [greetMessage, setGreetMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/hello`)
      .then(res => {
        if (!res.ok) throw new Error('서버 응답을 받지 못했습니다.');
        return res.json();
      })
      .then(data => setHelloMessage(data.text))
      .catch(() => setHelloMessage('API에서 메시지를 가져오지 못했습니다. 서버를 확인해주세요.'));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setGreetMessage('');

    try {
      const response = await fetch(`${API_BASE}/greet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        throw new Error('요청 중 문제가 발생했습니다.');
      }

      const data = await response.json();
      setGreetMessage(data.text);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Go API 연동 React 데모</h1>
        <p style={styles.subtitle}>Go로 만든 API와 통신하는 간단한 예제 페이지</p>
      </header>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>기본 메시지</h2>
        <p style={styles.message}>{helloMessage}</p>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>나만의 인사말 받아보기</h2>
        <p style={styles.helper}>이름을 입력한 뒤 버튼을 눌러 인사말을 받아보세요.</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="이름을 입력하세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button} disabled={isSubmitting}>
            {isSubmitting ? '요청 중...' : '인사말 요청'}
          </button>
        </form>
        {greetMessage && <div style={styles.result}>{greetMessage}</div>}
        {error && <div style={styles.error}>{error}</div>}
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f7f9fb',
    padding: '40px 20px',
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    margin: 0,
    fontSize: '28px',
    color: '#0f172a'
  },
  subtitle: {
    marginTop: '8px',
    color: '#475569'
  },
  card: {
    width: '100%',
    maxWidth: '640px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)',
    marginBottom: '24px'
  },
  sectionTitle: {
    margin: '0 0 12px',
    color: '#111827',
    fontSize: '20px'
  },
  message: {
    margin: 0,
    color: '#334155',
    fontSize: '18px'
  },
  helper: {
    margin: '4px 0 12px',
    color: '#6b7280'
  },
  form: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  input: {
    flex: 1,
    minWidth: '240px',
    padding: '12px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '16px'
  },
  button: {
    padding: '12px 18px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 600,
    minWidth: '140px',
    transition: 'background-color 0.2s ease'
  },
  result: {
    marginTop: '14px',
    padding: '12px',
    backgroundColor: '#ecfeff',
    border: '1px solid #a5f3fc',
    borderRadius: '10px',
    color: '#0e7490'
  },
  error: {
    marginTop: '14px',
    padding: '12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    color: '#b91c1c'
  }
};

export default App;
