import React, { Component } from 'react'
import LazyLoad from 'react-lazyload';
import axios from 'axios'
import uuid from "uuid";
import '../Post/Post.css'

class Post extends Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedFile: null,
            response: null,
            image: null,
            progress: null,
            finished: false,
            db: false,
            images: null,
            update: false
        }
    }

    componentDidMount() {
        this.getImgs()
        this.dbInterval = setInterval(this.listen4DB, 100)
        this.updateInterval = setInterval(this.update, 3000)
    }

    listen4DB = () => {
        if (this.state.images) {
            clearInterval(this.dbInterval)
            this.setState({ db: true })
        }
    }

    update = () => {
        if (this.state.update) {
            this.getImgs()
            this.setState({ update: false, finished: false, image: false })
        }
    }

    getImgs = () => {
        let targetUrl = 'http://localhost:8000/api/images'
        let temp = []

        fetch(targetUrl)
            .then(response => response.json())
            .then(data => {
                for (let i = 0; i < data.length; i++) {
                    temp.push(data[i])
                }
                this.setState({ images: temp })
            })
            .catch(error => alert('Sorry the service is down \n:(\nPlease try again later'));
    }

    selectImg = (event) => {
        this.setState({ selectedFile: event.target.files[0] })

        if (event.target.files && event.target.files[0]) {
            let img = event.target.files[0];
            this.setState({ image: URL.createObjectURL(img), finished: false });
        }
    }

    uploadImg = () => {
        const formData = new FormData()
        formData.append('image', this.state.selectedFile)
        const apiKey = "eeadc880da3384d7927fb106962183a2" // <== your imgBB key here
        axios.post("https://api.imgbb.com/1/upload?key=" + apiKey + "&name=" + uuid.v4() + "&image=", formData, {

            onUploadProgress: ProgressEvent => {

                this.setState({ progress: Math.round(ProgressEvent.loaded / ProgressEvent.total * 100), finished: false })
            }
        })
            .then(res => {
                this.setState({ response: res, finished: true, progress: null, update: true })
                this.storeUrl(this.state.response.data.data.display_url)
            });
    }

    storeUrl = (args) => {
        if (this.state.response) {
            fetch('http://localhost:8000/api/images', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: uuid.v4(),
                    url: args
                })
            })
        }
    }

    render() {
        return (
            <div className="Container">
                <div className="Upload_Container">
                    {this.state.finished && <p id="success">Success!!!</p>}
                    <label className="File_Upload">
                        <input id="choose-file" type="file" onChange={this.selectImg} />
                Choose Image
                </label>
                    {!this.state.image && <img id="upload-img" src='./res/noImg.png' alt="./res/noImg.png" onLoad={this.checkDimensions} />}
                    {this.state.image && <img id="upload-img" src={this.state.image} alt="./res/noImg.png" onLoad={this.checkDimensions} />}
                    {this.state.progress > 0 && <p id="progress">{this.state.progress} %</p>}
                    {this.state.image && <p id="upload-btn" onClick={this.uploadImg}>Upload</p>}
                </div>
                <div className="Img_Container">
                    {this.state.db && this.state.images.map((img, i) =>
                        <LazyLoad
                            key={i}
                            height={100}>
                            <div>
                                <img src={img.url} alt="./res/noImg.png" />
                            </div>
                        </LazyLoad>)}
                </div>
            </div>

        );
    }
}

export default Post