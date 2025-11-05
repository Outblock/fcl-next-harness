import "../styles/globals.css"

function MyApp({ Component, pageProps }) {
  return (
    <div className="dark bg-background min-h-screen">
      <Component {...pageProps} />
    </div>
  )
}

export default MyApp
