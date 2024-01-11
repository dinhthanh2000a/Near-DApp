import dynamic from 'next/dynamic';

import styles from '@/app/app.module.css';
import { DocsCard, HelloNearCard } from '@/components/cards';
import { NetworkId, ComponentMap } from '@/config';

import { randomBytes } from 'crypto'

const Component = dynamic(() => import('@/components/vm-component'), { ssr: false });

const socialComponents = ComponentMap[NetworkId];

// const signMessage = ()=>{
//   const challenge = randomBytes(32)
//   console.log('challenge:', challenge)
//   const message = 'Login with NEAR'
//   const recipient = "dinhthanh.testnet"
//   const signature = wallet.signMessage({ message, recipient, nonce: challenge, callbackUrl: "" })
//   console.log('signature:', signature)
// }

export default function HelloComponents() {

  return (
    <>
      <main className={styles.main}>
        <div className={styles.description}>
          <p>
            Loading components from: &nbsp;
            <code className={styles.code}>{socialComponents.socialDB}</code>
          </p>
        </div>
        <div className={styles.center}>
          <h1> <code>Multi-chain</code> Components Made Simple </h1>
        </div>
        <div className='row'>
          <div class="col-6">
            <Component src={socialComponents.HelloNear} />
            <p class="my-4">&nbsp;</p>
            <Component src={socialComponents.LoveNear} />
          </div>
          <div class="col-6">
            <Component src={socialComponents.Lido} />
          </div>
        </div>
        <hr />

        {/* <button onClick={signMessage()}>
          Sign 
        </button> */}

        <div className={styles.grid}>
          <DocsCard />
          <HelloNearCard />
        </div>
      </main>
    </>
  );
}