<script setup>
import { ref, onMounted } from "vue"
import { CopyOutline } from "@vicons/ionicons5"
import { Icon } from "@vicons/utils"
import { Codemirror } from 'vue-codemirror'
import { getReport } from './http/api'
import { solidity } from '@replit/codemirror-lang-solidity'
import { showFailToast } from 'vant'


import { getQueryVariable, getContractInfo, formatAddress, getCreatorAddress, getSourceCode, copy, toEtherscanAddress } from "./utils/utils"

const contractInfo = ref({})
const activeNames = ref([])
const chainId = ref('')
const contractAddress = ref('')
const show = ref(false)
const dialogContent = ref('')

const extensions = [solidity]
contractAddress.value = getQueryVariable("address")
chainId.value = getQueryVariable("chainid")
const getData = async () => {
  contractInfo.value = {address: contractAddress.value, chainId: chainId.value}
  getCreatorAddress(contractInfo.value).then(res => {
    contractInfo.value.contractCreator = res.contractCreator
  })
  contractInfo.value = await getContractInfo(contractInfo.value)
  contractInfo.value = await getSourceCode(contractInfo.value)
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

const formatReport = (code) => {
  if (code) {
    code = code.replace(/\n/g, '<br />')
    code = code.replace(/(<br \/>)+/g, '<br />')
  }
  return code
}

onMounted(() => {
  if (contractAddress.value && chainId.value) {
    getData()
  } else {
    console.log('error')
    showFailToast('缺少必要参数')
  }
})
</script>

<template>
  <div class="content">
    <h1 class="title">Contract Info</h1>
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
    </div>
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
              style="height: 100%;flex: 1;font-size: .24rem;max-height: 500px;"
            />
          </van-collapse-item>
        </van-collapse>
        <div v-else>No source code</div>
      </div>
      <div class="loading" v-else>
        <van-loading v-if="contractAddress && chainId" color="#1989fa" size="48" />
      </div>
    </div>
    <van-dialog v-model:show="show" title="" show-cancel-button width="80vw" :showCancelButton="false">
      <div v-if="dialogContent" v-html="formatReport(dialogContent)" class="report-dialog"></div>
      <div v-else class="dialog-not"><van-loading  color="#1989fa" size="48" /><p>Please wait a moment, the whole process may take around 20 seconds</p> </div>
    </van-dialog>
  </div>
</template>

