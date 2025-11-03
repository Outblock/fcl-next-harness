import "../styles/globals.css"

function MyApp({ Component, pageProps }) {
  return (
    <div className="dark min-h-screen">
      <Component {...pageProps} />
    </div>
  )
}

export default MyApp
