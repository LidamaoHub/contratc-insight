<script setup>
import { ref, onBeforeMount, watch } from "vue"
import { CopyOutline, AlertCircleSharp, HelpCircleSharp } from "@vicons/ionicons5"
import { Icon } from "@vicons/utils"
import { Codemirror } from 'vue-codemirror'
import { getReport, getTxAmount, getProxyUpdate, getShortUrl } from './http/api'
import { solidity } from '@replit/codemirror-lang-solidity'
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { showFailToast, showDialog } from 'vant'

import { getContractInfo, formatAddress, getCreatorAddress, getSourceCode, copy, toEtherscanAddress, formatDate } from "./utils/utils"

const contractInfo = ref({})
const activeNames = ref([])
const chainId = ref('')
const navIndex = ref(0)
const contractAddress = ref('')
const currentRate = ref(100)
const show = ref(false)
const dialogContent = ref('')
const reportedCount = ref(-1)
const gradientColor = ref('#04c086')
const progress = ref(100)
const showLoading = ref(false)
const riskDefaultBorderColor = ref('#ff0620')
const riskDefaultBgColor = ref('rgba(215, 56, 71, 0.098)')
const riskNoBorderColor = ref('#28A745')
const riskNoBgColor = ref('rgba(40, 167, 69, 0.098)')

const extensions = [solidity, vscodeDark]
const url = window.location.href
const token = url.split("/mm")[1]
const getData = async () => {
  contractInfo.value = {address: contractAddress.value, chainId: chainId.value, riskList: {}}
  getCreatorAddress(contractInfo.value).then(res => {
    contractInfo.value.contractCreator = res.contractCreator
  })
  contractInfo.value = await getContractInfo(contractInfo.value)
  if (!contractInfo.value.isProxy) {
    progress.value -= 20
    contractInfo.value.riskList.upgradeable = {type: false, text: 'upgradeable contract'}
    showLoading.value = false
  } else {
    showLoading.value = true
    getRiskListFun()
  }
  contractInfo.value = await getSourceCode(contractInfo.value)
  if (!contractInfo.value.isOpenSources) {
    progress.value -= 20
    contractInfo.value.riskList.openSourceType = {type: false, text: 'openSourceType'}
  }
  console.log(contractInfo.value)
}

const getReportFun = (index) => {
  let code = contractInfo.value.sources[index].content
  let report = contractInfo.value.sources[index].report
  if (report) dialogContent.value = report
  if (code && !report) {
    getReport({code}).then(res => {
      console.log(res)
      let report = res.report
      contractInfo.value.sources[index].report = report
      dialogContent.value = report
    })
  }
  show.value = true
}

const getRiskListFun = () => {
  getProxyUpdate({admin_address: contractInfo.value.adminAddress, chain_id: chainId.value}).then(res => {
    let deploy = res.deploy
    let update = res.update
    contractInfo.value.deploy = deploy.timestamp
    contractInfo.value.update = update.timestamp
    if (deploy?.risk === true) {
      contractInfo.value.riskList.deploy = {risk: true, text: 'recently deployed', timestamp: deploy.timestamp}
      progress.value -= 20
    }
    if (update?.risk === true) {
      contractInfo.value.riskList.update = {risk: true, text: 'recently updated', timestamp: update.timestamp}
      progress.value -= 20
    }
  })
  getTxAmount({contract_address: contractAddress.value, chain_id: chainId.value}).then(res => {
    let address = res.address
    let tx = res.tx
    if (address?.risk === true) {
      contractInfo.value.riskList.address = {risk: true, text: 'less address', amount: address.amount, desc: `only ${address.amount} address`}
      progress.value -= 20
    }
    if (tx?.risk === true) {
      contractInfo.value.riskList.tx = {risk: true, text: 'less transaction', amount: tx.amount, desc: `only ${tx.amount} transaction`}
      progress.value -= 20
    }
    showLoading.value = false
  })
}

const formatReport = (code) => {
  if (code) {
    code = code.replace(/\n/g, '<br />')
    code = code.replace(/(<br \/>)+/g, '<br />')
  }
  return code
}

const showDialogFun = () => {
  showDialog({
    message: 'Scores are for reference only and are based on contractual behavior.',
    width: '280px',
    closeOnClickOverlay: true
  })
}

onBeforeMount(() => {
  console.log('before')
  if (token) {
    showLoading.value = true
    getShortUrl({token}).then(res => {
      if (res.code == 0) {
        contractAddress.value = res.contract_address
        chainId.value = res.chain_id
        getData()
      }
    })
  } else {
    showFailToast('missing required parameters')
  }
  setTimeout(() => {
    reportedCount.value = 0
  }, 2000)
})

watch(() => progress.value, (val) => {
  if (val >= 70) {
    gradientColor.value = '#07C160'
  } else if (val >= 40) {
    gradientColor.value = '#ff9000'
  } else {
    gradientColor.value = '#FF0620'
  }
})
</script>

<template>
  <div class="content">
    <div class="nav flex-center-sb">
      <div :class="['nav-item', navIndex == 0 ? 'nav-item-active' : '']" @click="navIndex = 0">score</div>
      <div :class="['nav-item', navIndex == 1 ? 'nav-item-active' : '']" @click="navIndex = 1">info</div>
      <div :class="['nav-item', navIndex == 2 ? 'nav-item-active' : '']" @click="navIndex = 2">AI audit</div>
    </div>
    <div v-show="navIndex == 0" class="section">
      <div class="score">
        <div class="score-hd flex">
          <div class="chart">
            <van-circle
              v-model:current-rate="currentRate"
              :rate="progress"
              :speed="50"
              :stroke-width="60"
              size="75px"
              :color="gradientColor"
              layer-color="rgb(255, 244, 244)"
            >
              <template #default>
                <div class="circle-text" :style="{color: gradientColor}">{{ progress + '%' }}</div>
              </template>
            </van-circle>
          </div>
          <p>safety score</p>
          <Icon size="18px" @click="showDialogFun" >
            <HelpCircleSharp />
          </Icon>
        </div>
        <div>
          <div class="risk" :style="{'border-color': contractInfo.isGetSources && !showLoading && !(contractInfo.riskList && Object.keys(contractInfo.riskList).length)  ? riskNoBorderColor  : riskDefaultBorderColor, background: contractInfo.isGetSources && !showLoading && !(contractInfo.riskList && Object.keys(contractInfo.riskList).length)  ? riskNoBgColor  : riskDefaultBgColor}">
            <div class="risk-hd">Contract Risk</div>
            <div class="risk-list" v-if="contractInfo.riskList && Object.keys(contractInfo.riskList).length">
              <div class="risk-item" v-for="(val, key, index) in contractInfo.riskList" :key="index">
                <div>
                  <div class="risk-item-title">{{ val.text }}</div>
                  <div class="risk-item-desc">{{ val.desc || '' }}</div>
                </div>
                
                <Icon size="18" class="iconsize-18"  color="#FF0620">
                  <AlertCircleSharp />
                </Icon>
              </div>
            </div>
            <div v-if="contractInfo.isGetSources && !showLoading && !(contractInfo.riskList && Object.keys(contractInfo.riskList).length)" class="no-risk">
              <p>no risk funded</p> 
            </div>
            <div v-if="showLoading || !contractInfo.isGetSources" class="loading" style="min-height: 120px">
              <span v-if="contractAddress && chainId" class="loader"></span>
            </div>
          </div>
          <div class="user">
            <div class="user-hd">Contract Controversial</div>
            <div class="user-content">
              <p v-if="reportedCount >= 0">{{ reportedCount }} users reported the contractas deceptive</p> 
              <div v-else class="loading" style="min-height: 100px">
                <span class="loader"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-show="navIndex == 1" class="section">
      <div class="info">
        <div class="item">
          <div class="label">Contract Address</div>
          <div v-if="contractInfo.address" class="value flex">
            <a :href="toEtherscanAddress(contractInfo.address, chainId)" target="_blank">{{formatAddress(contractInfo.address, 8)}}</a> 
            <Icon color="#6c757d" class="copy-icon" @click="copy(contractInfo.address)">
              <CopyOutline />
            </Icon>
          </div>
          <div v-else class="value flex">--</div>
        </div>
        <div class="item">
          <div class="label">Creator Address</div>
          <div v-if="contractInfo.contractCreator" class="value flex">
            <a :href="toEtherscanAddress(contractInfo.contractCreator, chainId)" target="_blank">{{formatAddress(contractInfo.contractCreator, 8)}}</a> 
            <Icon color="#6c757d" class="copy-icon" @click="copy(contractInfo.contractCreator)">
              <CopyOutline />
            </Icon>
          </div>
          <div v-else class="value flex">--</div>
        </div>
        <div class="item">
          <div class="label">Proxy Address</div>
          <div v-if="contractInfo.proxyAddress" class="value flex">
            <a :href="toEtherscanAddress(contractInfo.proxyAddress, chainId)" target="_blank">{{formatAddress(contractInfo.proxyAddress, 8)}}</a> 
            <Icon color="#6c757d" class="copy-icon" @click="copy(contractInfo.proxyAddress)">
              <CopyOutline />
            </Icon>
          </div>
          <div v-else class="value flex">--</div>
        </div>
        <div class="item">
          <div class="label">Is Proxy</div>
          <div class="value flex" v-if="contractInfo.adminAddress">{{ contractInfo.isProxy ? 'Yes' : 'No' }}</div>
          <div class="value flex" v-else><van-loading  color="#6c757d" size="18" v-if="contractAddress && chainId" /><span v-else>--</span></div>
        </div>
        <div class="item">
          <div class="label">Is OpenSoure</div>
          <div class="value flex" v-if="contractInfo.isGetSources">{{ contractInfo.sources ? 'Yes' : 'No' }}</div>
          <div class="value flex" v-else><van-loading  color="#6c757d" size="18" v-if="contractAddress && chainId" /><span v-else>--</span></div>
        </div>
        <div class="item">
          <div class="label">Deploy</div>
          <div class="value flex" v-if="contractInfo.deploy">{{ formatDate('YYYY-mm-dd', contractInfo.deploy * 1000) }}</div>
          <div class="value flex" v-else><van-loading  color="#6c757d" size="18" v-if="showLoading" /><span v-else>--</span></div>
        </div>
        <div class="item">
          <div class="label">Update</div>
          <div class="value flex" v-if="contractInfo.update">{{ formatDate('YYYY-mm-dd', contractInfo.update * 1000) }}</div>
          <div class="value flex" v-else><van-loading  color="#6c757d" size="18" v-if="showLoading" /><span v-else>--</span></div>
        </div>
      </div>
    </div>
    <div v-show="navIndex == 2" class="section">
      <div class="sources">
        <div class="sources-title">Source Code</div>
        <div v-if="contractInfo.isGetSources" class="main">
          <van-collapse v-if="contractInfo.sources && contractInfo.sources.length" v-model="activeNames">
            <van-collapse-item v-for="(item, index) in contractInfo.sources" :key="index" :title="item.name" :name="index">
              <template #value>
                <div class="collapse-btn" @click.stop="getReportFun(index)">Audit</div>
              </template>
              <Codemirror
                v-model="item.content"
                :disabled="true"
                :extensions="extensions"
                style="height: 100%;flex: 1;font-size: 12px;max-height: 800px;"
              />
            </van-collapse-item>
          </van-collapse>
          <div v-else>No source code</div>
        </div>
        <div class="loading" v-else>
          <span v-if="contractAddress && chainId" class="loader"></span>
        </div>
      </div>
    </div>
    <van-dialog v-model:show="show" title="" show-cancel-button width="280px" :showCancelButton="false">
      <div v-if="dialogContent" v-html="formatReport(dialogContent)" class="report-dialog"></div>
      <div v-else class="dialog-not"><span v-if="contractAddress && chainId" class="loader"></span><p>Please wait a moment, the whole process may take around 20 seconds</p> <p style="margin-top:20px;color:#35393F">AI audit based on GPT-4</p> </div>
    </van-dialog>
    <!-- <van-dialog v-model:show="show" title="" show-cancel-button width="80vw" :showCancelButton="false">
      <div v-if="dialogContent" v-html="formatReport(dialogContent)" class="report-dialog"></div>
      <div v-else class="dialog-not"><van-loading  color="#1989fa" size="48" /><p>Please wait a moment, the whole process may take around 20 seconds</p> </div>
    </van-dialog> -->
  </div>
</template>

