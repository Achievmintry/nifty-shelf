import React, { Component } from 'react';
import './App.css';
import {
  Grid,
  Message,
  Input,
  Form,
  Menu,
  Segment,
  Header,
  Divider,
  Icon,
  Button,
  Progress,
  Popup,
  Container,
  Modal,
  Table,
  Image,
  List,
  Search,
  Responsive,
  Visibility,
  Accordion,
  Card,
  Reveal,
  Sidebar,
  Dropdown
} from 'semantic-ui-react';
import {
  Dapparatus,
  Gas,
  // ContractLoader,
  // Transactions,
  // Events,
  // Scaler,
  Blockie
} from 'dapparatus';
// import { DapparatusCustom } from './components/DapparatusCustom';
// import ContractLoaderCustom from './components/ContractLoaderCustom';
import TransactionsCustom from './components/transactionsCustom';
import Web3 from 'web3';
import web3 from './ethereum/web3';
import moment from 'moment';
import _ from 'lodash';
// import sampleABI from './ethereum/sampleABI1'; // ABI for test purposes
import PropTypes from 'prop-types';
import { TwitterShareButton } from 'react-share';
const axios = require('axios');
// Dapparatus
const METATX = {
  endpoint: 'http://0.0.0.0:1001/',
  contract: '0xf5bf6541843D2ba2865e9aeC153F28aaD96F6fbc'
  // accountGenerator: '//account.metatx.io'
};
const WEB3_PROVIDER = 'https://ropsten.infura.io/UkZfSHYlZUsRnBPYPjTO';
// image assets
// const chelseaHello = require('./assets/chelsea-hello.png');

const twitter = require('./assets/twitter.png');
const user = require('./assets/user.png');
const ethereum = require('./assets/ethereum.png');
const github = require(`./assets/github.png`);
const question = require(`./assets/question.png`);
const exampleMobile = require(`./assets/exampleMobile.png`);
const basicShelf = require(`./assets/basicShelf.png`);
const basicShelfSmall = require(`./assets/basicShelfSmall.png`);
const shelfLogo = require(`./assets/shelfLogo.png`);
const unknownTrophy = require(`./assets/unknownTrophy.png`);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      abi: { abi: 'empty' },
      abiRaw: '',
      network: '',
      requiredNetwork: '',
      contractAddress: '',
      getnftData: '',
      errorMessage: false,
      loading: false,
      methodData: [],
      mnemonic: '',
      metaData: {},
      nftData: false,
      recentContracts: {},
      userSavedContracts: {},
      externalContracts: [],
      userHasBeenLoaded: false,
      activeIndex: [],
      activeItem: 'write',
      // ENS
      ensSubnode: 'myDapp2',
      ensFee: 0.01,
      existingSubnodes: [],
      //Search
      results: [],
      isLoading: false,
      // Display states
      currentDappFormStep: 0,
      displayDappForm: true, // Set to true to see landing page
      displayLoading: false,
      //new from dapparatus
      enableDapparatus: false,
      web3: false,
      account: false,
      gwei: 4,
      doingTransaction: false,
      customLoader: false
    };
  }
  componentDidMount = async () => {
    if (!this.getNFT()) {
      // this.getRecentPublicContracts();
      // this.getExternalContracts();
      // this.getExistingSubnodes();
    }
  };
  // componentDidUpdate() {
  //   if (
  //     !this.state.userHasBeenLoaded &&
  //     this.state.account &&
  //     this.state.displayDappForm
  //   ) {
  //     this.getUserSavedContracts();
  //   }
  // }

  getNFT = () => {
    let userAddress = window.location.pathname.substring(1, 43);
    if (userAddress.length > 1) {
      this.showLoading('downloading');
      this.setState({
        enableDapparatus: false,
        displayDappForm: false,
        userAddress
      });

      axios
        .get(`https://api.opensea.io/api/v1/assets?owner=${userAddress}`)
        .then(result => {
          // console.log(result);
          if (result.data.assets && result.data.assets.length < 1) {
            console.log(`Could not find any trophies for ${userAddress}`);
            this.showLoading('not found');
          } else {
            document.title = `Nifty Shelf: ${userAddress}`;
            console.log('Open Sea API data: ');
            console.log(result.data);
            let newData = result.data;
            axios.get(`/shelf/${userAddress}`).then(result => {
              newData.userAddress = userAddress;
              newData.viewCount = result.data.viewCount;
              this.setState({
                displayLoading: false,
                nftData: newData
              });
            });
          }
        })
        .catch(e => {
          console.log(`Could not find any trophies for ${userAddress}`);
          this.showLoading('not found');
        });
      return true;
    } else {
      return false;
      // this.handleChangeABI({}, { value: this.state.abiRaw });
    }
  };
  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  };
  handleInput(e) {
    let update = {};
    update[e.target.name] = e.target.value;
    this.setState(update);
  }
  handleToggleAccordian = (e, titleProps) => {
    // Manages which premium feature is active
    const { index } = titleProps;
    const { activeIndex } = this.state;
    let newIndex = activeIndex;
    if (activeIndex && activeIndex.includes(index)) {
      newIndex.splice(activeIndex.indexOf(index), 1);
    } else newIndex.push(index);
    this.setState({ activeIndex: newIndex });
  };
  handleMenuTabChange = (e, { name }) =>
    this.setState({ activeItem: name, activeIndex: [] });
  handleChangeABI = (e, { value }) => {
    this.setState({ abi: '', abiRaw: value, loading: true, errorMessage: '' });
    const { contractAddress } = this.state;
    if (value) {
      // Don't run unless there is some text present
      // Check for proper formatting and create a new contract instance
      try {
        if (value.includes('pragma')) {
          // Check if it is a smart contract
          // console.log('input is a smart contract');
          // // var output = solc.compile(value);
          // console.log(JSON.stringify(output));
          // output.contracts['splitter'].interface;
          this.setState({ solidity: value });
        } else {
          // Parse the ABI normally and apply fixes as needed
          const abiObject = JSON.parse(value);
          // Name any unnammed outputs (fix for ABI/web3 issue on mainnet)
          abiObject.forEach((method, i) => {
            if (method.stateMutability === 'view') {
              method.outputs.forEach((output, j) => {
                if (!abiObject[i].outputs[j].name) {
                  abiObject[i].outputs[j].name = 'unnamed #' + (j + 1);
                }
              });
            }
            var newMethodData = this.state.methodData;
            // Check whether the method exists in the arguments list
            var methodExists = newMethodData[i];
            // Make a new entry if the method doesn't exist
            if (!methodExists) {
              newMethodData.push({
                name: method.name,
                inputs: [],
                outputs: []
              });
              this.setState({ methodData: newMethodData });
            }
            console.log(newMethodData);
          });
          const myContract = new web3.eth.Contract(abiObject, contractAddress);
          // Save the formatted abi for use in renderInterface()
          this.setState({
            abi: JSON.stringify(myContract.options.jsonInterface)
          });
        }
      } catch (err) {
        this.setState({
          errorMessage: err.message
        });
        return;
      }
    }
    this.setState({ loading: false });
  };
  handleMethodDataChange = (e, { methodIndex, value, inputindex, payable }) => {
    // Takes inputs from the user and stores them to JSON object methodArguments
    let newMethodData = this.state.methodData;
    if (inputindex === -1) {
      newMethodData[methodIndex].value = value;
    } else {
      newMethodData[methodIndex].inputs[inputindex] = value;
    }
    this.setState({ methodData: newMethodData, errorMessage: false });
    // console.log(JSON.stringify(this.state.methodData));
  };
  handleResultSelect = (e, { result }) => {
    const name = `${result.title} (clone)`;
    this.setState({
      dappName: name,
      requiredNetwork: 'Mainnet',
      contractAddress: result.address,
      abiRaw: JSON.stringify(result.abi),
      currentDappFormStep: 2
    });
  }; // dAppForm search bar
  handleSearchChange = (e, { value }) => {
    this.setState({ isLoading: true, dappName: value });
    setTimeout(() => {
      if (value.length < 1) return this.resetComponent();
      const re = new RegExp(_.escapeRegExp(value), 'i');
      const isMatch = result => re.test(result.title);
      this.setState({
        isLoading: false,
        results: _.filter(this.state.externalContracts, isMatch)
      });
    }, 300);
  }; // dAppForm search bar
  handleEnsSearchChange = (e, { value }) => {
    this.setState({ isLoading: true, ensSubnode: value });
    setTimeout(() => {
      if (value.length < 1) return this.resetComponent();
      const isExactMatch = result => {
        return value === result.title;
      };
      this.setState({
        isLoading: false,
        results: _.filter(this.state.existingSubnodes, isExactMatch)
      });
    }, 300);
  }; // dAppForm ENS selection
  resetComponent = () =>
    this.setState({ isLoading: false, results: [], dappName: '' }); // dAppForm search bar/ENS selection
  handleSubmitSend = (e, { methodIndex }) => {
    const { methodData, abi, contractAddress, account } = this.state;
    // send() methods alter the contract state, and require gas.
    console.log('Performing function #' + methodIndex + " 'send()'...");
    this.setState({ errorMessage: '' });
    let newMethodData = methodData;
    const method = methodData[methodIndex];
    if (!method) {
      this.setState({ errorMessage: 'You must enter some values' });
    } else {
      console.log('method submitted' + JSON.stringify(method));
      // Generate the contract object
      // TODO instead use the contract instance created during submitDapp()
      try {
        const myContract = new web3.eth.Contract(
          JSON.parse(abi),
          contractAddress
        );
        myContract.methods[method.name](...method.inputs)
          .send({
            from: account,
            value: web3.utils.toWei(method.value || '0', 'ether')
          })
          .then(response => {
            // console.log('pass bool check' + typeof response);
            if (typeof response === 'boolean') {
              newMethodData[methodIndex].outputs[0] = response.toString();
            } else if (typeof response === 'object') {
              Object.entries(response).forEach(([key, value]) => {
                newMethodData[methodIndex].outputs[key] = value.toString();
              });
            } else newMethodData[methodIndex].outputs[0] = response;
            this.setState({ methodData: newMethodData });
          })
          .catch(err => {
            this.setState({ errorMessage: err.message });
          });
      } catch (err) {
        this.setState({ errorMessage: err.message });
      }
    }
  };
  handleSubmitCall = (e, { methodIndex }) => {
    // call() methods do not alter the contract state. No gas needed.
    const { abi, contractAddress, methodData } = this.state;
    console.log('Performing function #' + methodIndex + " 'call()'...");
    let newMethodData = methodData;
    this.setState({ errorMessage: '' });
    // note: only gets first method. There could be more with identical name
    // TODO fix this ^
    const method = methodData[methodIndex];
    console.log('method submitted' + JSON.stringify(method));
    let inputs = method.inputs || []; // return an empty array if no inputs exist
    // Generate the contract object
    // TODO instead use the contract instance created during submitDapp()
    try {
      const myContract = new web3.eth.Contract(
        JSON.parse(abi),
        contractAddress
      );
      // using "..." to destructure inputs[]
      myContract.methods[method.name](...inputs)
        .call({
          from: this.state.account
        })
        .then(response => {
          if (typeof response === 'boolean') {
            newMethodData[methodIndex].outputs[0] = response.toString();
          } else if (typeof response === 'object') {
            Object.entries(response).forEach(([key, value]) => {
              newMethodData[methodIndex].outputs[key] = value.toString();
            });
          } else newMethodData[methodIndex].outputs[0] = response;
          this.setState({ methodData: newMethodData });
        })
        .catch(err => {
          this.setState({ errorMessage: err.message });
        });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    }
  };
  handleCreateNewDapp = () => {
    this.setState({
      currentDappFormStep: 1,
      enableDapparatus: true
    });
    window.scrollTo(0, 0);
  };
  handleSubmitSuggestion = () => {
    axios
      .post(`/suggestion`, {
        suggestion: this.state.suggestion
      })
      .then(
        this.setState({
          suggestionSubmitted: true
        })
      )
      .catch(err => {
        console.log(err);
      });
  };

  showErrorMessage = type => {
    let message = <div />;
    if (this.state.errorMessage) {
      if (type === 'popup') {
        message = (
          <div
            style={{
              position: 'fixed',
              zIndex: 10,
              top: 60,
              left: 60,
              paddingRight: 60,
              textAlign: 'left'
            }}
          >
            <Message
              style={{ zIndex: 12 }}
              size="large"
              error
              onDismiss={() => this.setState({ errorMessage: false })}
              header="Error:"
              content={this.state.errorMessage}
            />
          </div>
        );
      } else {
        message = (
          <Message
            style={{ zIndex: 12 }}
            attached="top"
            error
            header="Oops!"
            content={this.state.errorMessage}
          />
        );
      }
    }
    return message;
  };
  showLoading = action => {
    let loading = false;
    if (action === 'downloading') {
      loading = (
        <div className="loadingDIV">
          <Icon.Group size="huge">
            <Icon loading size="large" name="circle notch" />
            <Icon name="download" />
          </Icon.Group>
          <Header as="h2">Loading...</Header>
          <Image centered src={shelfLogo} size="large" />
        </div>
      );
    } else if (action === 'not found') {
      loading = (
        <div className="dAppNotFound">
          <Container>
            <Grid stackable columns={2}>
              <Grid.Column>
                <Icon size="huge" name="ban" />
                <Header as="h2">
                  Sorry, we couldn't find any NFT trophies for this address.
                </Header>
                <br />
                <h2>
                  <a
                    href={`https://blockscout.com/eth/mainnet/address/${
                      this.state.userAddress
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {this.state.userAddress.substring(0, 6)}...
                    {this.state.userAddress.substring(38, 50)}
                  </a>
                </h2>
                <Button
                  onClick={() => {
                    window.location.replace(`/`);
                  }}
                  color="green"
                  size="huge"
                  icon="retweet"
                  content="Start over"
                />
              </Grid.Column>
              <Grid.Column>
                <Image centered src={shelfLogo} size="large" />
              </Grid.Column>
            </Grid>
          </Container>
        </div>
      );
    }
    this.setState({ displayLoading: loading });
  };

  renderDappForm() {
    const { currentDappFormStep } = this.state;
    const errorMessage = this.showErrorMessage();
    let formDisplay = [];

    if (currentDappFormStep < 1) {
      formDisplay = (
        <div>
          <Responsive minWidth={Responsive.onlyTablet.minWidth}>
            <div className="homePageHeader">
              <Grid
                container
                stackable
                columns={2}
                verticalAlign="middle"
                textAlign="center"
              >
                <Grid.Column textAlign="left">
                  <p style={{ fontSize: '4em' }}>
                    NFT trophies...
                    <br />
                    on a shelf
                  </p>
                </Grid.Column>
                <Grid.Column>
                  <Image src={shelfLogo} />
                </Grid.Column>
                <Divider hidden />
                <Grid.Row />
              </Grid>
              <Container>
                <p style={{ textAlign: 'left', fontSize: '2em' }}>
                  Enter your ETH address:
                </p>
                <Form
                  error={!!this.state.errorMessage}
                  onSubmit={() =>
                    window.location.replace(`/${this.state.userAddress}`)
                  }
                >
                  <Form.Group>
                    <Form.Input
                      size="huge"
                      placeholder="0xabc..."
                      required
                      width={11}
                      name="userAddress"
                      onChange={this.handleChange}
                      value={this.state.userAddress}
                    />
                    <Form.Button
                      icon="wizard"
                      width={5}
                      color="green"
                      size="huge"
                      content="Create your Nifty Shelf"
                    />
                  </Form.Group>
                </Form>
              </Container>
            </div>
          </Responsive>
          <Responsive maxWidth={Responsive.onlyMobile.maxWidth}>
            <div className="homePageHeaderMobile">
              <p style={{ fontSize: '3em' }}>
                NFT trophies...
                <br />
                on a shelf
              </p>
              <Image
                centered
                src={shelfLogo}
                style={{ paddingRight: '2rem', paddingLeft: '2rem' }}
              />
              <br />
              <br />
              <Container>
                <Form
                  error={!!this.state.errorMessage}
                  onSubmit={() =>
                    window.location.replace(`/${this.state.userAddress}`)
                  }
                >
                  <Form.Input
                    size="huge"
                    placeholder="0xabc..."
                    label="Enter your ETH address"
                    fluid
                    name="userAddress"
                    onChange={this.handleChange}
                    value={this.state.userAddress}
                  />
                  <Form.Button
                    icon="wizard"
                    color="green"
                    size="huge"
                    content="Create your Nifty Shelf"
                  />
                </Form>
              </Container>
            </div>
          </Responsive>
          <div className="homePageContentWhite">
            <Grid container stackable columns={2}>
              <Grid.Row textAlign="left" verticalAlign="middle">
                <Grid.Column>
                  <h1>Interested in dApps?</h1>
                  <h3>
                    Make your own in seconds. No coding required, free and
                    open-source. Check it out at{' '}
                    <a href="https://OneClickdApp.com" target="blank">
                      OneClickdApp.com
                    </a>
                  </h3>
                </Grid.Column>
                <Grid.Column>
                  <Image src={exampleMobile} size="large" />
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </div>
          <div className="homePageContent">
            <Grid container stackable columns={2}>
              <Grid.Row verticalAlign="middle">
                <Grid.Column textAlign="left">
                  <h1>Suggestions?</h1>
                  <h3>
                    Let us know if something is broken, share what you think we
                    should build next, or just say hello!
                  </h3>
                </Grid.Column>
                <Grid.Column textAlign="left">
                  <Form
                    error={!!this.state.errorMessage}
                    onSubmit={this.handleSubmitSuggestion}
                    success={this.state.suggestionSubmitted}
                  >
                    <Form.TextArea
                      placeholder="You guys rock!"
                      required
                      name="suggestion"
                      onChange={this.handleChange}
                      value={this.state.suggestion}
                    />
                    <Form.Button
                      icon="share"
                      primary
                      size="huge"
                      content="Send"
                    />
                    <Message success header="Thank you!" />
                  </Form>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </div>
        </div>
      );
    }
    return <div>{formDisplay}</div>;
  }
  renderFooter() {
    return (
      <div className="footer">
        <Grid divided stackable textAlign="left">
          <Grid.Row>
            <Grid.Column width={3}>
              <h4>Nifty Shelf</h4>
              <List link>
                <List.Item
                  style={{ color: 'white' }}
                  as="a"
                  href="https://opensea.io"
                  target="blank"
                >
                  Data by OpenSea.io
                </List.Item>
                <List.Item
                  style={{ color: 'white' }}
                  as="a"
                  href="mailto:blockchainbuddha@gmail.com?subject=Question%20about%20NiftyShelf.com"
                  target="_self"
                >
                  Contact Us
                </List.Item>
              </List>
            </Grid.Column>
            <Grid.Column width={3}>
              <h4>Other cool stuff</h4>
              <List link>
                <List.Item
                  style={{ color: 'white' }}
                  as="a"
                  href="https://oneclickdapp.com"
                  target="blank"
                >
                  One Click dApp
                </List.Item>
              </List>
            </Grid.Column>
            <Grid.Column width={7}>
              <p>Your ERC-721 tokens... on a shelf.</p>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>Copyright 2019 NiftyShelf.com</Grid.Row>
        </Grid>
      </div>
    );
  }
  renderInterface() {
    const { nftData, activeIndex } = this.state;
    const errorMessage = this.showErrorMessage('popup');
    let trophies = this.renderTrophies();

    return (
      <div
        style={{
          paddingTop: '3em',
          paddingBottom: '5em'
        }}
      >
        <Grid stackable container columns={4} textAlign="center">
          {trophies}
        </Grid>
        {errorMessage}
      </div>
    );
  }
  renderTrophies() {
    const { nftData } = this.state;
    let displayTrophies = [];
    let lastShelfIndex = 0;
    if (nftData.assets) {
      nftData.assets.forEach((trophy, index) => {
        let displayLastSale = [];
        if (trophy.last_sale && trophy.last_sale.seller) {
          displayLastSale = (
            <Table.Row textAlign="center">
              <Table.Cell>
                <Icon name="legal" size="large" />
              </Table.Cell>
              <Table.Cell textAlign="left">
                Bought for{' '}
                {web3.utils
                  .fromWei(trophy.last_sale.total_price, 'ether')
                  .substring(0, 5)}{' '}
                {trophy.last_sale.payment_token.symbol} from{' '}
                {(
                  <a
                    href={`https://blockscout.com/eth/mainnet/address/${
                      trophy.last_sale.seller.address
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {trophy.last_sale.seller.address.substring(0, 6)}...
                    {trophy.last_sale.seller.address.substring(38, 50)}
                  </a>
                ) || 'unknown'}
              </Table.Cell>
            </Table.Row>
          );
        }
        if (index - lastShelfIndex > 3) {
          lastShelfIndex = index;
          displayTrophies.push(
            <Responsive minWidth={Responsive.onlyTablet.minWidth}>
              <Grid.Row>
                <Image centered src={basicShelf} />
              </Grid.Row>
            </Responsive>
          );
        }
        let displayExternalLink = (
          <Table.Row>
            <Table.Cell textAlign="center">
              <Icon name="linkify" />
            </Table.Cell>
            <Table.Cell>
              {trophy.asset_contract.name}#{trophy.token_id}
              <br />
              (No link provided)
            </Table.Cell>
          </Table.Row>
        );
        if (trophy.external_link) {
          displayExternalLink = (
            <Table.Row>
              <Table.Cell textAlign="center">
                <Image size="mini" src={trophy.asset_contract.image_url} />
              </Table.Cell>
              <Table.Cell>
                <a href={trophy.external_link} target="_blank" rel="noopener">
                  {trophy.asset_contract.name} #{trophy.token_id}
                </a>
              </Table.Cell>
            </Table.Row>
          );
        }
        let trophyImage = unknownTrophy;
        if (trophy.image_url) {
          trophyImage = trophy.image_url;
        }
        displayTrophies.push(
          <Accordion
            as={Grid.Column}
            verticalAlign="bottom"
            key={index}
            style={{
              textAlign: 'center',
              height: '100%',
              paddingBottom: '7rem',
              zIndex: 100 - index
            }}
          >
            <Modal
              closeIcon
              trigger={
                <Image
                  src={trophyImage}
                  centered
                  className="trophyImage"
                  as={Card}
                  link
                  style={{
                    background: `#${trophy.background_color}`
                  }}
                />
              }
              basic
              size="large"
            >
              <Header content={trophy.name || '(unknown)'} />
              <Modal.Content>
                <Image src={trophyImage} centered />
              </Modal.Content>
            </Modal>

            <Card
              link
              raised
              centered
              style={{
                position: 'absolute',
                left: '50%',
                marginLeft: '-140px',
                width: '280px'
              }}
            >
              <Card.Content>
                <Accordion.Title
                  active={this.state.activeIndex.includes(index)}
                  index={index}
                  onClick={this.handleToggleAccordian}
                >
                  <Header
                    style={{
                      wordWrap: 'break-word',
                      textAlign: 'center'
                    }}
                  >
                    {trophy.name || '(unknown)'}
                  </Header>
                </Accordion.Title>
                <Accordion.Content
                  active={this.state.activeIndex.includes(index)}
                >
                  <Table basic unstackable definition>
                    <Table.Body>
                      <Table.Row>
                        <Table.Cell textAlign="center">
                          <Icon name="comment" size="large" />
                        </Table.Cell>
                        <Table.Cell>{trophy.description}</Table.Cell>
                      </Table.Row>
                      {displayExternalLink}
                      <Table.Row>
                        <Table.Cell textAlign="center">
                          <Icon name="at" size="large" />
                        </Table.Cell>
                        <Table.Cell>
                          <a
                            href={`https://blockscout.com/eth/mainnet/address/${
                              trophy.asset_contract.address
                            }`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {trophy.asset_contract.address.substring(0, 6)}...
                            {trophy.asset_contract.address.substring(38, 50)}
                          </a>
                        </Table.Cell>
                      </Table.Row>
                      {displayLastSale}
                    </Table.Body>
                  </Table>
                </Accordion.Content>
              </Card.Content>
            </Card>
          </Accordion>
        );
        displayTrophies.push(
          <Responsive maxWidth={Responsive.onlyTablet.minWidth}>
            <Grid.Row>
              <Image
                centered
                src={basicShelfSmall}
                style={{ paddingTop: '6rem' }}
              />
            </Grid.Row>
          </Responsive>
        );
        if (index === nftData.assets.length - 1) {
          displayTrophies.push(
            <Responsive minWidth={Responsive.onlyTablet.minWidth}>
              <Grid.Row>
                <Image centered src={basicShelf} />
              </Grid.Row>
            </Responsive>
          );
        }
      });
    }
    return displayTrophies;
  }
  renderNewSendFunctions() {
    const abiObject = JSON.parse(this.state.abi);
    let displayFunctions = [];
    abiObject.forEach((method, index) => {
      if (method.stateMutability !== 'view' && method.type === 'function')
        displayFunctions.push(
          <Accordion
            as={Card}
            link
            raised
            centered
            key={index}
            className="function"
            // style={{ background: nftData.colorLight }}
          >
            <Card.Content textAlign="left">
              <Accordion.Title
                active={this.state.activeIndex.includes(index)}
                index={index}
                onClick={this.handleToggleAccordian}
              >
                <Grid columns="equal" verticalAlign="middle">
                  <Grid.Column width={3}>
                    <Icon size="large" circular name="pencil" />
                  </Grid.Column>
                  <Grid.Column fluid>
                    <Header style={{ wordWrap: 'break-word' }}>
                      {method.name}
                    </Header>
                  </Grid.Column>
                </Grid>
              </Accordion.Title>
              <Accordion.Content
                active={this.state.activeIndex.includes(index)}
              >
                {this.renderPremiumFunctions(index)}
              </Accordion.Content>
            </Card.Content>
          </Accordion>
        );
    });
    return displayFunctions;
  }
  renderNewCallFunctions() {
    const abiObject = JSON.parse(this.state.abi);
    let displayFunctions = [];
    abiObject.forEach((method, index) => {
      if (method.stateMutability === 'view')
        displayFunctions.push(
          <Accordion
            as={Card}
            link
            raised
            centered
            key={index}
            className="function"
            // style={{ background: nftData.colorLight }}
          >
            <Card.Content textAlign="left">
              <Accordion.Title
                active={this.state.activeIndex.includes(index)}
                index={index}
                onClick={this.handleToggleAccordian}
              >
                <Grid columns="equal" verticalAlign="middle">
                  <Grid.Column width={3}>
                    <Icon size="large" circular name="eye" />
                  </Grid.Column>
                  <Grid.Column fluid>
                    <Header style={{ wordWrap: 'break-word' }}>
                      {method.name}
                    </Header>
                  </Grid.Column>
                </Grid>
              </Accordion.Title>
              <Accordion.Content
                active={this.state.activeIndex.includes(index)}
              >
                {this.renderPremiumFunctions(index)}
              </Accordion.Content>
            </Card.Content>
          </Accordion>
        );
    });
    return displayFunctions;
  }
  renderPremiumFunctions(methodIndex, premium, helperText, colorDark) {
    if (this.state.abi) {
      try {
        const abiObject = JSON.parse(this.state.abi);
        const method = abiObject[methodIndex];
        let onSubmit = this.handleSubmitCall;
        var inputs = [];
        var outputs = [];
        let displayResponse = <div />;
        let displayMethod = <div />;
        let displayButton = <div />;
        let displayHelperText;
        if (helperText && helperText != '') {
          displayHelperText = (
            <Segment style={{ background: colorDark, color: 'white' }}>
              <i>{helperText}</i>
            </Segment>
          );
        }
        let displayFooterText = '';
        if (premium) {
          displayFooterText = <i>{method.name}</i>;
        }
        let buttonStyle = {
          backgroundColor: '#c2cafc'
        };
        if (colorDark) {
          buttonStyle = {
            backgroundColor: colorDark,
            color: 'white'
          };
        }
        if (method.stateMutability !== 'view' && method.type === 'function') {
          onSubmit = this.handleSubmitSend;
          method.inputs.forEach((input, j) => {
            inputs.push(
              <Form.Input
                required
                methodIndex={methodIndex}
                key={j}
                inputindex={j}
                label={input.name}
                placeholder={input.type}
                onChange={this.handleMethodDataChange}
              />
            );
          });
          if (method.payable) {
            inputs.push(
              <Form.Input
                required
                key={method.name}
                inputindex={-1}
                methodIndex={methodIndex}
                label={`Value to send (ETH)`}
                placeholder="value"
                onChange={this.handleMethodDataChange}
              />
            );
          }
          displayButton = (
            <Form.Button
              icon="write"
              labelPosition="left"
              content="Sign & Submit"
              style={buttonStyle}
            />
          );
        } else if (method.stateMutability === 'view') {
          method.inputs.forEach((input, j) => {
            inputs.push(
              <Form.Input
                required
                methodIndex={methodIndex}
                inputindex={j}
                key={j}
                inline
                label={input.name}
                placeholder={input.type}
                onChange={this.handleMethodDataChange}
              />
            );
          });
          displayButton = (
            <Form.Button
              icon="refresh"
              content="Check"
              labelPosition="left"
              style={buttonStyle}
            />
          );
        }
        if (this.state.methodData[methodIndex].outputs.length > 0) {
          method.outputs.forEach((output, j) => {
            const outputData = this.state.methodData[methodIndex].outputs[j];
            outputs.push(
              <div key={j}>
                {output.name || '(unnamed)'} <i>{output.type}</i>:
                <Container style={{ wordWrap: 'break-word' }}>
                  <b>{outputData || ' '}</b>
                </Container>
              </div>
            );
          });
          displayResponse = (
            <div>
              <Divider style={{ marginBottom: 0 }} />
              <Header as="h4" textAlign="center" style={{ marginTop: 2 }}>
                Response
              </Header>
              {outputs}
            </div>
          );
        }
        displayMethod = (
          <div>
            {displayHelperText}
            <Form
              onSubmit={onSubmit}
              methodIndex={methodIndex}
              key={method.name}
            >
              {inputs}
              <Container textAlign="center">
                {displayButton}
                {displayFooterText}
              </Container>
            </Form>
            {displayResponse}
          </div>
        );
        return <div>{displayMethod}</div>;
      } catch (e) {
        return <h2>Error generating function from ABI</h2>;
      }
    }
  }
  render() {
    let {
      account,
      gwei,
      block,
      avgBlockTime,
      etherscan,

      displayDappForm,
      displayLoading,
      enableDapparatus
    } = this.state;
    let connectedDisplay = [];
    if (web3 && !displayDappForm) {
      connectedDisplay.push(
        <Gas
          key="Gas"
          onUpdate={state => {
            console.log('Gas price update:', state);
            this.setState(state, () => {
              console.log('GWEI set:', this.state.gwei);
            });
          }}
        />
      );
      // connectedDisplay.push(
      //   <ContractLoaderCustom
      //     key="Contract Loader Custom"
      //     config={{ hide: false }}
      //     web3={this.state.web3}
      //     onReady={contracts => {
      //       console.log('contracts loaded', contracts);
      //       this.setState({ contracts: contracts });
      //     }}
      //     address={contractAddress}
      //     abi={this.state.abiRaw}
      //     contractName={getnftData}
      //   />
      // );

      // connectedDisplay.push(
      //   <ContractLoader
      //     key="ContractLoader"
      //     config={{ DEBUG: true }}
      //     web3={web3}
      //     require={path => {
      //       return require(`${__dirname}/${path}`);
      //     }}
      //     onReady={(contracts, customLoader) => {
      //       console.log('contracts loaded', contracts);
      //       this.setState(
      //         {
      //           customLoader: customLoader,
      //           contracts: contracts
      //         },
      //         async () => {
      //           console.log('Contracts Are Ready:', this.state.contracts);
      //         }
      //       );
      //     }}
      //   />
      // );

      // if (contracts) {
      //   connectedDisplay.push(
      //     <Events
      //       key="Events"
      //       config={{ hide: false, debug: true }}
      //       contract={contracts.splitter}
      //       eventName={'Create'}
      //       block={block}
      //       id={'_id'}
      //       filter={{ _owner: account }}
      //       onUpdate={(eventData, allEvents) => {
      //         console.log('EVENT DATA:', eventData);
      //         this.setState({ events: allEvents });
      //       }}
      //     />
      //   );
      // }
      connectedDisplay.push(
        // Simple UI tweak for TransactionsCustom
        <Responsive
          key="Transactions"
          minWidth={Responsive.onlyTablet.minWidth}
        >
          <TransactionsCustom
            config={{ DEBUG: false }}
            account={account}
            gwei={gwei}
            web3={web3}
            block={block}
            avgBlockTime={avgBlockTime}
            etherscan={etherscan}
            onReady={state => {
              console.log('Transactions component is ready:', state);
              this.setState(state);
            }}
            onReceipt={(transaction, receipt) => {
              console.log('Transaction Receipt', transaction, receipt);
            }}
          />
        </Responsive>
      );
    }
    let dapparatus;
    if (enableDapparatus) {
      dapparatus = (
        <Dapparatus
          config={{
            DEBUG: false,
            requiredNetwork: this.state.requiredNetwork,
            hide: displayDappForm,
            textStyle: {
              color: '#000000'
            },
            warningStyle: {
              fontSize: 20,
              color: '#d31717'
            },
            blockieStyle: {
              size: 5,
              top: 0
            }
          }}
          metatx={METATX}
          fallbackWeb3Provider={new Web3.providers.HttpProvider(WEB3_PROVIDER)}
          onUpdate={state => {
            console.log('dapparatus state update:', state);
            if (state.web3Provider) {
              state.web3 = new Web3(state.web3Provider);
              this.setState(state);
            }
          }}
        />
      );
    }
    let mainDisplay = [];
    if (displayLoading) {
      mainDisplay = displayLoading;
    } else if (displayDappForm) {
      mainDisplay = this.renderDappForm();
    } else {
      mainDisplay = this.renderInterface();
    }
    return (
      <div className="App">
        <div className="content">
          <ResponsiveContainer
            className="ResponsiveContainer"
            dapparatus={dapparatus}
            nftData={this.state.nftData}
          >
            {mainDisplay}
            {connectedDisplay}
          </ResponsiveContainer>
        </div>
        {this.renderFooter()}
      </div>
    );
  }
}

export default App;

// Mobile Responsive components
const ResponsiveContainer = ({ children, dapparatus, nftData }) => (
  <div>
    <DesktopContainer dapparatus={dapparatus} nftData={nftData}>
      {children}
    </DesktopContainer>
    <MobileContainer dapparatus={dapparatus} nftData={nftData}>
      {children}
    </MobileContainer>
  </div>
);
class DesktopContainer extends Component {
  state = {};

  hideFixedMenu = () => this.setState({ fixed: false });
  showFixedMenu = () => this.setState({ fixed: true });

  render() {
    const { children, dapparatus, nftData } = this.props;
    let backgroundColor = null;
    if (nftData.premium) {
      backgroundColor = nftData.colorLight;
    }

    return (
      <Responsive minWidth={Responsive.onlyTablet.minWidth}>
        <Visibility
          once={false}
          onBottomPassed={this.showFixedMenu}
          onBottomPassedReverse={this.hideFixedMenu}
        >
          <Menu borderless size="huge">
            <Menu.Menu className="topMenu" style={{ backgroundColor }}>
              <Menu.Item as="a" href="https://niftyshelf.com">
                Nifty Shelf
              </Menu.Item>

              <Menu.Item>
                <Dropdown simple text="About">
                  <Dropdown.Menu>
                    <Dropdown.Item
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://github.com/blockchainbuddha/nifty-shelf"
                      image={github}
                      text="Github"
                    />
                    <Dropdown.Item
                      image={twitter}
                      href="https://twitter.com/pi0neerpat"
                      target="_blank"
                      rel="noopener noreferrer"
                      text="Developer twitter"
                    />
                  </Dropdown.Menu>
                </Dropdown>
              </Menu.Item>
            </Menu.Menu>
            <div className="dapparatus">{dapparatus}</div>
          </Menu>
          <Heading nftData={nftData} />
        </Visibility>
        {children}
      </Responsive>
    );
  }
}
class MobileContainer extends Component {
  state = {};

  handlePusherClick = () => {
    const { sidebarOpened } = this.state;

    if (sidebarOpened) this.setState({ sidebarOpened: false });
  };

  handleToggle = () =>
    this.setState({ sidebarOpened: !this.state.sidebarOpened });

  render() {
    const { children, dapparatus, nftData } = this.props;
    const { sidebarOpened } = this.state;
    let backgroundColor = null;
    if (nftData.premium) {
      backgroundColor = nftData.colorLight;
    }
    return (
      <Responsive maxWidth={Responsive.onlyMobile.maxWidth}>
        <Sidebar.Pushable>
          <Sidebar
            as={Menu}
            animation="uncover"
            vertical
            inverted
            pointing
            borderless
            visible={sidebarOpened}
          >
            <Menu.Item as="a" href="https://niftyshelf.com">
              Nifty Shelf
            </Menu.Item>
            <Menu.Item
              as="a"
              image={twitter}
              href="https://twitter.com/pi0neerpat"
              target="_blank"
              rel="noopener noreferrer"
            >
              Developer Twitter
            </Menu.Item>
            <Menu.Item
              as="a"
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/blockchainbuddha/nifty-shelf"
              image={github}
            >
              Github
            </Menu.Item>
          </Sidebar>
          <Sidebar.Pusher
            dimmed={sidebarOpened}
            onClick={this.handlePusherClick}
            style={{ minHeight: '100vh' }}
          >
            <Menu borderless size="large">
              <Menu.Menu className="topMenu" style={{ backgroundColor }}>
                <Menu.Item onClick={this.handleToggle}>
                  <Icon name="sidebar" />
                </Menu.Item>
              </Menu.Menu>
              <div className="dapparatusMobile">{dapparatus}</div>
            </Menu>
            <Heading mobile nftData={nftData} />
            {children}
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      </Responsive>
    );
  }
}
// Handles favicon, background, and header for premium dApp
const Heading = ({ mobile, nftData }) => {
  var link =
    document.querySelector("link[rel*='icon']") ||
    document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'shortcut icon';
  link.href = nftData.favicon;
  document.getElementsByTagName('head')[0].appendChild(link);
  document.body.style.background = '#c2cafc';
  // document.body.style.backgroundAttachment = 'fixed';

  if (nftData.assets && nftData.assets.length > 0) {
    const etherscan = ''; //translateEtherscan(nftData.network[0]);
    const displayRegistryData = getRegistryData(
      nftData.metaData,
      nftData.network
    );
    let displayTitle = (
      <Header as="h1" style={{ wordWrap: 'break-word' }}>
        {nftData.userAddress}
      </Header>
    );
    if (nftData.assets[0].owner.user && nftData.assets[0].owner.user.username) {
      displayTitle = (
        <Header as="h1" style={{ wordWrap: 'break-word' }}>
          {nftData.assets[0].owner.user.username}'s Trophies{' '}
        </Header>
      );
    }
    return (
      <div className="defaultHeader">
        <Grid
          stackable
          columns={2}
          style={{
            paddingTop: mobile ? '1em' : '2em'
          }}
        >
          <Grid.Row textAlign="center" verticalAlign="middle">
            <Grid.Column>
              {displayTitle}
              <Container>
                <TwitterShareButton
                  title={`Check out my cool Nifty trophies! niftyshelf.com/${
                    nftData.userAddress
                  }`}
                  url={`niftyshelf.com/${nftData.userAddress}`}
                  hashtags={['NFT', 'ERC721', 'NiftyShelf']}
                >
                  <Button secondary>
                    <Image inline src={twitter} size="mini" /> Make 'em jealous
                  </Button>
                </TwitterShareButton>
              </Container>
            </Grid.Column>
            <Grid.Column>
              <Table basic unstackable definition>
                <Table.Body>
                  <Table.Row>
                    <Table.Cell textAlign="center">
                      <Image src={user} size="mini" centered />
                    </Table.Cell>
                    <Table.Cell>
                      <a
                        href={`https://blockscout.com/eth/mainnet/address/${
                          nftData.userAddress
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {nftData.userAddress.substring(0, 6)}...
                        {nftData.userAddress.substring(38, 50)}
                      </a>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell textAlign="center">
                      <Icon name="bookmark" size="large" />
                    </Table.Cell>
                    <Table.Cell>
                      <b>
                        <a
                          href={`niftyshelf.com/${nftData.userAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          niftyshelf.com/{nftData.userAddress.substring(0, 6)}
                          ...
                          {nftData.userAddress.substring(38, 50)}
                        </a>
                      </b>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell textAlign="center">
                      <Icon name="eye" size="large" />
                    </Table.Cell>
                    <Table.Cell>{nftData.viewCount} views</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  } else {
    return null;
  }
};
ResponsiveContainer.propTypes = {
  children: PropTypes.node,
  dapparatus: PropTypes.object
};
DesktopContainer.propTypes = {
  children: PropTypes.node,
  dapparatus: PropTypes.object
};
MobileContainer.propTypes = {
  children: PropTypes.node
};
Heading.propTypes = {
  mobile: PropTypes.bool
};

function translateEtherscan(network) {
  let etherscan = 'https://etherscan.io/';
  if (network) {
    if (network === 'Unknown' || network === 'private') {
      etherscan = 'http://localhost:8000/#/';
    } else if (network === 'POA') {
      etherscan = 'https://blockscout.com/poa/core/';
    } else if (network === 'xDai') {
      etherscan = 'https://blockscout.com/poa/dai/';
    } else if (network !== 'Mainnet') {
      etherscan = 'https://' + network + '.etherscan.io/';
    }
  }
  return etherscan;
}
function getRegistryData(metaData, network) {
  let registryData = '(available only on mainnet)';
  if (metaData && metaData.data) {
    registryData = (
      <div>
        <Popup
          hoverable
          keepInViewPort
          position="bottom left"
          trigger={
            <Segment
              compact
              size="tiny"
              onClick={() => {
                window.open(metaData.data.metadata.url, '_blank');
              }}
            >
              <Image inline size="mini" src={metaData.data.metadata.logo} />
              {metaData.name}
            </Segment>
          }
        >
          <Table definition unstackable collapsing>
            <Table.Body>
              <Table.Row>
                <Table.Cell>Description</Table.Cell>
                <Table.Cell>{metaData.data.metadata.description}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Verified</Table.Cell>
                <Table.Cell>
                  {JSON.stringify(metaData.data.metadata.reputation.verified)}
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Status</Table.Cell>
                <Table.Cell>
                  {metaData.data.metadata.reputation.status}
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Category</Table.Cell>
                <Table.Cell>
                  {metaData.data.metadata.reputation.category}
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Self attested</Table.Cell>
                <Table.Cell>{metaData.self_attested.toString()}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Curated</Table.Cell>
                <Table.Cell>{metaData.curated.toString()}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Scam info</Table.Cell>
                <Table.Cell>{JSON.stringify(metaData.data.scamdb)}</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
          Metadata powered by{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://ethregistry.org/"
          >
            Eth Registry
          </a>
        </Popup>
      </div>
    );
  } else if (network === 'Mainnet') {
    registryData = (
      <div>
        Metadata: Nothing found. Add it to{' '}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="http://www.oneclickdapp.com/resume-reflex/"
        >
          EthRegistry
        </a>
      </div>
    );
  }
  return registryData;
}
