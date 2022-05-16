import abi from "../utils/BuyMeACoffee.json";
import { ethers } from "ethers";
import Head from "next/head";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Box, Button, Grid, Input, Text, Textarea } from "@chakra-ui/react";
import { faMugHot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "../styles/Home.module.css";

export default function Home() {
  // Contract Address & ABI
  const contractAddress = "0x45D886d76809b492Cf52d173E9cD81ff4bb7428a";
  const contractABI = abi.abi;

  // Component state
  const [currentAccount, setCurrentAccount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState([]);

  const onNameChange = (event) => {
    setName(event.target.value);
  };

  const onMessageChange = (event) => {
    setMessage(event.target.value);
  };

  // Wallet connection logic
  const isWalletConnected = async () => {
    try {
      const { ethereum } = window;

      const accounts = await ethereum.request({ method: "eth_accounts" });
      console.log("accounts: ", accounts);

      if (accounts.length > 0) {
        const account = accounts[0];
        console.log("wallet is connected! " + account);
      } else {
        console.log("make sure MetaMask is connected");
      }
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("please install MetaMask");
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const buyCoffee = async (amount) => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, "any");
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("buying coffee..");
        const coffeeTxn = await buyMeACoffee.buyCoffee(
          name ? name : "anon",
          message ? message : "Enjoy your coffee!",
          { value: ethers.utils.parseEther(amount) }
        );

        await coffeeTxn.wait();

        console.log("mined ", coffeeTxn.hash);

        console.log("coffee purchased!");

        // Clear the form fields.
        setName("");
        setMessage("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Function to fetch all memos stored on-chain.
  const getMemos = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("fetching memos from the blockchain..");
        const memos = await buyMeACoffee.getMemos();
        console.log("fetched!");
        setMemos(memos);
      } else {
        console.log("Metamask is not connected");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let buyMeACoffee;
    isWalletConnected();
    getMemos();

    // Create an event handler function for when someone sends
    // us a new memo.
    const onNewMemo = (from, timestamp, name, message) => {
      console.log("Memo received: ", from, timestamp, name, message);
      setMemos((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message,
          name,
        },
      ]);
    };

    const { ethereum } = window;

    // Listen for new memo events.
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      buyMeACoffee = new ethers.Contract(contractAddress, contractABI, signer);

      buyMeACoffee.on("NewMemo", onNewMemo);
    }

    return () => {
      if (buyMeACoffee) {
        buyMeACoffee.off("NewMemo", onNewMemo);
      }
    };
  }, []);

  return (
    <Box>
      <Box
        bgGradient={["linear(to-b, orange.100, orange.600)"]}
        className={styles.container}
      >
        <Head>
          <title>Buy Warlock a Coffee!</title>
          <meta name="description" content="Tipping site" />
        </Head>

        <Box className={styles.main}>
          <Text
            fontWeight={700}
            fontSize={60}
            alignSelf="center"
            sx={{ zIndex: 10, position: "relative" }}
          >
            Buy Warlock a Coffee!
          </Text>

          {currentAccount ? (
            <div>
              <form>
                <div>
                  <Text>Name</Text>
                  <Input
                    borderColor="orange.600"
                    _hover={{ borderColor: "orange.800" }}
                    focusBorderColor="orange.800"
                    _placeholder={{ opacity: 0.4, color: "orange.800" }}
                    id="name"
                    placeholder="anon"
                    onChange={onNameChange}
                  />
                </div>
                <br />
                <Grid flexDirection="row" gap={3}>
                  <Text>Send Warlock a message</Text>
                  <Textarea
                    borderColor="orange.600"
                    _hover={{ borderColor: "orange.800" }}
                    focusBorderColor="orange.800"
                    placeholder="Enjoy your coffee!"
                    id="message"
                    _placeholder={{ opacity: 0.4, color: "orange.800" }}
                    onChange={onMessageChange}
                    resize="none"
                    required
                  />
                  <Button
                    leftIcon={<FontAwesomeIcon icon={faMugHot} size="lg" />}
                    colorScheme="orange"
                    onClick={() => {
                      buyCoffee("0.001");
                    }}
                  >
                    Send 1 Coffee for 0.001ETH
                  </Button>
                  <Button
                    leftIcon={<FontAwesomeIcon icon={faMugHot} size="2x" />}
                    colorScheme="orange"
                    onClick={() => {
                      buyCoffee("0.003");
                    }}
                  >
                    Send 1 Large Coffee for 0.003ETH
                  </Button>
                </Grid>
              </form>
            </div>
          ) : (
            <Button
              variant="solid"
              colorScheme="orange"
              onClick={connectWallet}
            >
              Connect your wallet
            </Button>
          )}
        </Box>

        {currentAccount && <Text fontSize={40}>Memos received</Text>}

        {currentAccount &&
          memos
            .map((memo, idx) => {
              return (
                <div
                  key={idx}
                  style={{
                    border: "2px solid",
                    borderRadius: "5px",
                    padding: "5px",
                    margin: "5px",
                  }}
                >
                  <Text>"{memo.message}"</Text>
                  <Text>
                    From: {memo.name} at {memo.timestamp.toString()}
                  </Text>
                </div>
              );
            })
            .reverse()}
      </Box>

      <Box bgColor="orange.600" className={styles.footer}>
        <a
          href="https://alchemy.com/?a=roadtoweb3weektwo"
          target="_blank"
          rel="noopener noreferrer"
        >
          Created by @0xW4r10ck for Alchemy's Road to Web3 lesson two!
        </a>
      </Box>
    </Box>
  );
}
